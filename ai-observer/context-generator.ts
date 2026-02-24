import fs from "fs";
import path from "path";

interface FailureInfo {
  feature: string;
  scenario: string;
  step: string;
  stepDefFile: string;
  stepDefLine: number;
  pageObjectFile: string;
  pageObjectContent: string;
  error: string;
  brokenLocator: string;
  classification: string;
}

/**
 * ENTERPRISE FAILURE CLASSIFIER
 */
function classifyFailure(error: string): {
  healable: boolean;
  type: string;
} {
  const e = error.toLowerCase();

  // 🚫 Infra / Environment failures (DO NOT HEAL)
  if (
    e.includes("browsertype.launch") ||
    e.includes("executable doesn't exist") ||
    e.includes("net::err") ||
    e.includes("navigation failed") ||
    e.includes("process completed with exit code")
  ) {
    return { healable: false, type: "INFRASTRUCTURE" };
  }

  // 🔥 Strict mode violations
  if (e.includes("strict mode violation")) {
    return { healable: true, type: "STRICT_MODE" };
  }

  // 🔥 Locator waiting failures
  if (
    e.includes("waiting for locator") ||
    e.includes("locator(") ||
    e.includes("getbyrole") ||
    e.includes("getbytext") ||
    e.includes("getbylabel") ||
    e.includes("getbytestid")
  ) {
    return { healable: true, type: "LOCATOR_NOT_FOUND" };
  }

  // 🔥 Assertion failures on UI
  if (
    e.includes("tobevisible") ||
    e.includes("tohavetext") ||
    e.includes("tohavevalue") ||
    e.includes("not to be visible")
  ) {
    return { healable: true, type: "ASSERTION_VISIBILITY" };
  }

  // 🔥 DOM state issues
  if (
    e.includes("element is not attached") ||
    e.includes("element is not visible")
  ) {
    return { healable: true, type: "DOM_STATE" };
  }

  // 🔥 Cucumber step timeout (very important case)
  if (e.includes("function timed out")) {
    return { healable: true, type: "STEP_TIMEOUT_POSSIBLE_LOCATOR" };
  }

  // Default: not healable
  return { healable: false, type: "UNKNOWN" };
}

/**
 * Extract the broken locator string from the error message
 */
function extractBrokenLocator(error: string): string {
  // Match patterns like: locator('.login-form1 p') or locator('#some-id')
  const locatorMatch = error.match(/locator\(['"](.+?)['"]\)/);
  if (locatorMatch) return locatorMatch[1];

  // Match getByRole, getByText, etc.
  const roleMatch = error.match(/(getBy\w+)\(['"](.+?)['"]\)/i);
  if (roleMatch) return `${roleMatch[1]}('${roleMatch[2]}')`;

  return "Unknown";
}

/**
 * Extract the page object file path from the error stack trace
 */
function extractPageObjectFile(error: string): string {
  // Match: at ClassName.methodName (path/to/pages/SomePage.ts:line:col)
  const pageMatch = error.match(/at \w+\.\w+ \((.+?pages\/.+?\.ts):\d+:\d+\)/);
  if (pageMatch) return pageMatch[1].replace(/\\/g, "/");

  // Fallback: look for any pages/*.ts reference
  const fallback = error.match(/(pages\/\w+\.ts)/);
  if (fallback) return fallback[1];

  return "";
}

function parseCucumberJson(): FailureInfo | null {
  const reportPath = "artifacts/cucumber-report.json";

  if (!fs.existsSync(reportPath)) {
    console.log("Cucumber report not found.");
    return null;
  }

  const raw = fs.readFileSync(reportPath, "utf8");
  const features = JSON.parse(raw);

  for (const feature of features) {
    for (const scenario of feature.elements || []) {
      for (const step of scenario.steps || []) {
        if (step.result?.status === "failed") {
          const error = step.result.error_message || "";
          const classification = classifyFailure(error);

          if (!classification.healable) {
            console.log(
              `Failure classified as ${classification.type}. Skipping healing.`
            );
            return null;
          }

          const location = step.match?.location || "";
          const locMatch = location.match(/(.+\.ts):(\d+)/);

          const brokenLocator = extractBrokenLocator(error);
          const pageObjectFile = extractPageObjectFile(error);

          // Read the page object file content
          let pageObjectContent = "";
          if (pageObjectFile) {
            const resolvedPath = path.resolve(pageObjectFile);
            if (fs.existsSync(resolvedPath)) {
              pageObjectContent = fs.readFileSync(resolvedPath, "utf8");
            }
          }

          return {
            feature: feature.name,
            scenario: scenario.name,
            step: step.name,
            stepDefFile: locMatch ? locMatch[1].replace(/\\/g, "/") : "Unknown",
            stepDefLine: locMatch ? Number(locMatch[2]) : 0,
            pageObjectFile,
            pageObjectContent,
            error,
            brokenLocator,
            classification: classification.type,
          };
        }
      }
    }
  }

  return null;
}

export function generateContext(): FailureInfo | null {
  const failure = parseCucumberJson();

  if (!failure) {
    console.log("No healable failure detected.");
    return null;
  }

  const runId = process.env.GITHUB_RUN_ID || "LOCAL";
  const branch = process.env.GITHUB_REF_NAME || "LOCAL";
  const timestamp = new Date().toISOString();

  const content = `
# ENTERPRISE SELF-HEAL REPORT

## Metadata
- Branch: ${branch}
- Run ID: ${runId}
- Timestamp: ${timestamp}
- Classification: ${failure.classification}

---

## Failing Test

Feature: ${failure.feature}
Scenario: ${failure.scenario}

Step: ${failure.step}
Step Definition File: ${failure.stepDefFile}
Step Definition Line: ${failure.stepDefLine}

Page Object File: ${failure.pageObjectFile}
Broken Locator: ${failure.brokenLocator}

---

## Error Stack

\`\`\`
${failure.error}
\`\`\`

---

## Current Page Object Code

\`\`\`typescript
${failure.pageObjectContent}
\`\`\`

---

## COPILOT INSTRUCTIONS

You are fixing a Playwright + Cucumber (BDD) framework.

This failure is classified as: ${failure.classification}
The broken locator is: ${failure.brokenLocator}
The page object file is: ${failure.pageObjectFile}

STRICT RULES:

1. ONLY update the locator in the Page Object file.
2. DO NOT modify:
   - .feature files
   - step definition files
   - hooks
   - assertions logic
   - business logic
3. DO NOT introduce:
   - XPath
   - waitForTimeout
   - hardcoded delays
4. Preferred locator strategy order:
   - getByRole()
   - getByLabel()
   - getByTestId()
   - CSS locator() fallback
5. Maintain existing method signature.
6. If strict mode violation -> make locator more specific.
7. If timeout or locator not found -> fix the CSS selector.

Return ONLY the complete updated TypeScript file content for: ${failure.pageObjectFile}
Do NOT include any explanation, markdown formatting, or code fences.
Return raw TypeScript code only.
`;

  const outputPath = path.resolve("artifacts/heal-context.md");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content.trim());
  console.log("heal-context.md generated successfully.");

  // Also write structured JSON for the healer script
  const healData = {
    pageObjectFile: failure.pageObjectFile,
    pageObjectContent: failure.pageObjectContent,
    brokenLocator: failure.brokenLocator,
    classification: failure.classification,
    error: failure.error,
    feature: failure.feature,
    scenario: failure.scenario,
    step: failure.step,
  };

  const jsonPath = path.resolve("artifacts/heal-data.json");
  fs.writeFileSync(jsonPath, JSON.stringify(healData, null, 2));
  console.log("heal-data.json generated successfully.");

  return failure;
}

// Run if executed directly
generateContext();
