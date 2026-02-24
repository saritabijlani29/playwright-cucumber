import fs from "fs";
import path from "path";

interface HealData {
  pageObjectFile: string;
  pageObjectContent: string;
  brokenLocator: string;
  classification: string;
  error: string;
  feature: string;
  scenario: string;
  step: string;
}

/**
 * Calls GitHub Copilot Models API to fix the broken locator
 * in the page object file and writes the fixed code back.
 *
 * Requires GITHUB_TOKEN environment variable with Copilot access.
 */
async function healWithCopilot() {
  const healDataPath = path.resolve("artifacts/heal-data.json");
  const healContextPath = path.resolve("artifacts/heal-context.md");

  if (!fs.existsSync(healDataPath) || !fs.existsSync(healContextPath)) {
    console.log("No heal data found. Skipping.");
    process.exit(0);
  }

  const healData: HealData = JSON.parse(
    fs.readFileSync(healDataPath, "utf8")
  );
  const healContext = fs.readFileSync(healContextPath, "utf8");

  if (!healData.pageObjectFile || !healData.pageObjectContent) {
    console.log("No page object file identified. Cannot heal.");
    process.exit(0);
  }

  const token = process.env.GH_MODELS_TOKEN;
  if (!token) {
    console.error("GH_MODELS_TOKEN is not set. Add it as a repository secret.");
    console.error("Go to: https://github.com/<owner>/<repo>/settings/secrets/actions");
    process.exit(1);
  }

  console.log(`Healing locator in: ${healData.pageObjectFile}`);
  console.log(`Broken locator: ${healData.brokenLocator}`);
  console.log(`Classification: ${healData.classification}`);

  const systemPrompt = `You are an expert Playwright test automation engineer.
Your job is to fix broken CSS selectors/locators in Page Object files.

STRICT RULES:
1. ONLY fix the broken locator - do not change anything else.
2. DO NOT modify method signatures, assertions, imports, or class structure.
3. DO NOT introduce XPath, waitForTimeout, or hardcoded delays.
4. DO NOT increase any timeout values.
5. Preferred locator strategy: CSS selectors with class/attribute selectors.
6. Return ONLY the complete updated TypeScript file content.
7. Do NOT include markdown code fences, explanations, or comments about changes.
8. Return raw TypeScript code only.`;

  const userPrompt = `The following Playwright Page Object has a broken locator that causes test failure.

BROKEN LOCATOR: ${healData.brokenLocator}
CLASSIFICATION: ${healData.classification}

ERROR:
${healData.error}

CURRENT FILE (${healData.pageObjectFile}):
\`\`\`typescript
${healData.pageObjectContent}
\`\`\`

Fix the broken locator "${healData.brokenLocator}" and return the complete updated file.
The website is https://automationexercise.com.
Return ONLY raw TypeScript code, no markdown fences or explanations.`;

  try {
    // Use GitHub Models API (requires GH_MODELS_TOKEN PAT)
    const response = await fetch(
      "https://models.github.ai/inference/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          model: "gpt-4o",
          temperature: 0,
          max_tokens: 2000,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`GitHub Models API error (${response.status}): ${errorText}`);
      process.exit(1);
    }

    const data = await response.json();
    let fixedCode = data.choices?.[0]?.message?.content;

    if (!fixedCode) {
      console.error("No response from GitHub Models API.");
      process.exit(1);
    }

    // Clean any markdown code fences if present
    fixedCode = cleanCodeResponse(fixedCode);

    // Write the fixed file
    const filePath = path.resolve(healData.pageObjectFile);
    fs.writeFileSync(filePath, fixedCode, "utf8");
    console.log(`Successfully healed: ${healData.pageObjectFile}`);

    // Write heal summary
    const summary = {
      healed: true,
      file: healData.pageObjectFile,
      brokenLocator: healData.brokenLocator,
      classification: healData.classification,
      timestamp: new Date().toISOString(),
    };
    fs.writeFileSync(
      path.resolve("artifacts/heal-summary.json"),
      JSON.stringify(summary, null, 2)
    );
  } catch (error) {
    console.error("Error calling GitHub Models API:", error);
    process.exit(1);
  }
}

/**
 * Remove markdown code fences from API response
 */
function cleanCodeResponse(code: string): string {
  // Remove ```typescript ... ``` or ```ts ... ``` wrappers
  let cleaned = code.trim();
  cleaned = cleaned.replace(/^```(?:typescript|ts)?\s*\n?/i, "");
  cleaned = cleaned.replace(/\n?```\s*$/i, "");
  return cleaned.trim() + "\n";
}

healWithCopilot();
