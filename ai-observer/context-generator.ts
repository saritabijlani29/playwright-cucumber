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

function parseCucumberJson(): FailureInfo[] {
  const reportPath = "artifacts/cucumber-report.json";

  if (!fs.existsSync(reportPath)) {
    console.log("Cucumber report not found.");
    return [];
  }

  const raw = fs.readFileSync(reportPath, "utf8");
  const features = JSON.parse(raw);
  const failures: FailureInfo[] = [];

  for (const feature of features) {
    for (const scenario of feature.elements || []) {
      for (const step of scenario.steps || []) {
        if (step.result?.status === "failed") {
          const error = step.result.error_message || "";
          const classification = classifyFailure(error);

          if (!classification.healable) {
            console.log(
              `Failure in "${step.name}" classified as ${classification.type}. Skipping.`
            );
            continue;
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

          failures.push({
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
          });
        }
      }
    }
  }

  return failures;
}

export function generateContext(): FailureInfo[] {
  const failures = parseCucumberJson();

  if (failures.length === 0) {
    console.log("No healable failure detected.");
    return [];
  }

  console.log(`Found ${failures.length} healable failure(s).`);

  const runId = process.env.GITHUB_RUN_ID || "LOCAL";
  const branch = process.env.GITHUB_REF_NAME || "LOCAL";
  const timestamp = new Date().toISOString();

  // Build context for ALL failures
  let content = `# ENTERPRISE SELF-HEAL REPORT

## Metadata
- Branch: ${branch}
- Run ID: ${runId}
- Timestamp: ${timestamp}
- Total Failures: ${failures.length}

---
`;

  for (let i = 0; i < failures.length; i++) {
    const failure = failures[i];
    content += `
## Failure ${i + 1} of ${failures.length}

Feature: ${failure.feature}
Scenario: ${failure.scenario}

Step: ${failure.step}
Step Definition File: ${failure.stepDefFile}
Step Definition Line: ${failure.stepDefLine}

Page Object File: ${failure.pageObjectFile}
Broken Locator: ${failure.brokenLocator}
Classification: ${failure.classification}

### Error Stack

\`\`\`
${failure.error}
\`\`\`

### Current Page Object Code

\`\`\`typescript
${failure.pageObjectContent}
\`\`\`

---
`;
  }

  content += `
## COPILOT INSTRUCTIONS

You are fixing a Playwright + Cucumber (BDD) framework.
There are ${failures.length} broken locator(s) to fix.

STRICT RULES:

1. ONLY update locators in Page Object files.
2. DO NOT modify .feature files, step definitions, hooks, assertions, or business logic.
3. DO NOT introduce XPath, waitForTimeout, or hardcoded delays.
4. Preferred locator strategy: CSS selectors with class/attribute selectors.
5. Maintain existing method signatures.
6. If strict mode violation -> make locator more specific.
7. If timeout or locator not found -> fix the CSS selector.

Return ONLY the complete updated TypeScript file content.
Do NOT include any explanation, markdown formatting, or code fences.
Return raw TypeScript code only.
`;

  const outputPath = path.resolve("artifacts/heal-context.md");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content.trim());
  console.log("heal-context.md generated successfully.");

  // Group failures by page object file (multiple locators in same file)
  const groupedByFile: Record<string, { locators: string[]; errors: string[]; content: string }> = {};
  for (const failure of failures) {
    if (!failure.pageObjectFile) continue;
    if (!groupedByFile[failure.pageObjectFile]) {
      groupedByFile[failure.pageObjectFile] = {
        locators: [],
        errors: [],
        content: failure.pageObjectContent,
      };
    }
    groupedByFile[failure.pageObjectFile].locators.push(failure.brokenLocator);
    groupedByFile[failure.pageObjectFile].errors.push(failure.error);
  }

  // Write structured JSON with ALL failures for the healer
  const healData = {
    totalFailures: failures.length,
    files: Object.entries(groupedByFile).map(([file, data]) => ({
      pageObjectFile: file,
      pageObjectContent: data.content,
      brokenLocators: data.locators,
      errors: data.errors,
    })),
    failures: failures.map((f) => ({
      feature: f.feature,
      scenario: f.scenario,
      step: f.step,
      pageObjectFile: f.pageObjectFile,
      brokenLocator: f.brokenLocator,
      classification: f.classification,
      error: f.error,
    })),
  };

  const jsonPath = path.resolve("artifacts/heal-data.json");
  fs.writeFileSync(jsonPath, JSON.stringify(healData, null, 2));
  console.log("heal-data.json generated successfully.");

  return failures;
}

// Run if executed directly
generateContext();
