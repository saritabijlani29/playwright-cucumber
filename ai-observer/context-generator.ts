import fs from "fs";
import path from "path";

interface FailureInfo {
  feature: string;
  scenario: string;
  step: string;
  file: string;
  line: number;
  error: string;
}

function isLocatorFailure(error: string): boolean {
  return (
    error.includes("locator(") ||
    error.includes("getByRole") ||
    error.includes("getByText") ||
    error.includes("waiting for locator")
  );
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

          // 🔴 ENTERPRISE RULE: Skip non-locator failures
          if (!isLocatorFailure(error)) {
            console.log("Failure is NOT locator-based. Skipping healing.");
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
            error
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

Modify file only inside:
tests/pages/

Return updated TypeScript code only.

---

# 🛡 Guardrails Checklist

- [ ] Only locator updated
- [ ] No XPath
- [ ] No hard waits
- [ ] No logic change
- [ ] CI passes

---

# 🧪 Validation

Run:

npm run test:ci
`;

  const outputPath = path.resolve("artifacts/heal-context.md");
  fs.writeFileSync(outputPath, content.trim());

  console.log("heal-context.md generated successfully.");
}

generateContext();