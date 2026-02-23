import fs from "fs";
import path from "path";

interface FailureInfo {
  feature: string;
  scenario: string;
  step: string;
  file: string;
  line: number;
  error: string;
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
          const match = location.match(/(.+\.ts):(\d+)/);

          return {
            feature: feature.name,
            scenario: scenario.name,
            step: step.name,
            file: match ? match[1].replace(/\\/g, "/") : "Unknown",
            line: match ? Number(match[2]) : 0,
            error,
            classification: classification.type
          };
        }
      }
    }
  }

  return null;
}

function generateContext() {
  const failure = parseCucumberJson();

  if (!failure) {
    console.log("No healable failure detected.");
    return;
  }

  const runId = process.env.GITHUB_RUN_ID || "LOCAL";
  const branch = process.env.GITHUB_REF_NAME || "LOCAL";
  const timestamp = new Date().toISOString();

  const content = `
# 🔴 ENTERPRISE SELF-HEAL REPORT

## 📌 Metadata
- Branch: ${branch}
- Run ID: ${runId}
- Timestamp: ${timestamp}
- Classification: ${failure.classification}

---

## ❌ Failing Test

Feature: ${failure.feature}
Scenario: ${failure.scenario}

Step:
${failure.step}

File:
${failure.file}

Line:
${failure.line}

---

## 💥 Error Stack

\`\`\`
${failure.error}
\`\`\`

---

# 🧠 COPILOT INSTRUCTIONS

You are fixing a Playwright + Cucumber (BDD) framework.

This failure is classified as: ${failure.classification}

STRICT RULES:

1. ONLY update locator in Page Object.
2. DO NOT modify:
   - .feature files
   - step regex definitions
   - hooks
   - assertions
   - business logic
3. DO NOT introduce:
   - XPath
   - waitForTimeout
   - hardcoded delays
4. Preferred locator order:
   - getByRole()
   - getByLabel()
   - getByTestId()
   - locator() fallback
5. Maintain existing method signature.
6. If strict mode violation → make locator more specific.
7. If timeout → improve locator accuracy, NOT timeout value.

Modify file only inside:
pages/

Return updated TypeScript code only.

---

# 🛡 Guardrails Checklist

- [ ] Only locator updated
- [ ] No XPath
- [ ] No hard waits
- [ ] No timeout increase
- [ ] No logic change
- [ ] CI passes

---

# 🧪 Validation

Run:

npm test
`;

  const outputPath = path.resolve("artifacts/heal-context.md");
  fs.writeFileSync(outputPath, content.trim());

  console.log("heal-context.md generated successfully.");
}

generateContext();