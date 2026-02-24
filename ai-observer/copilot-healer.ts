import fs from "fs";
import path from "path";

interface HealFileEntry {
  pageObjectFile: string;
  pageObjectContent: string;
  brokenLocators: string[];
  errors: string[];
}

interface HealDataMulti {
  totalFailures: number;
  files: HealFileEntry[];
  failures: {
    feature: string;
    scenario: string;
    step: string;
    pageObjectFile: string;
    brokenLocator: string;
    classification: string;
    error: string;
  }[];
}

/**
 * Calls GitHub Models API to fix ALL broken locators
 * in the page object files and writes the fixed code back.
 *
 * Requires GH_MODELS_TOKEN environment variable (GitHub PAT).
 */
async function healWithCopilot() {
  const healDataPath = path.resolve("artifacts/heal-data.json");

  if (!fs.existsSync(healDataPath)) {
    console.log("No heal data found. Skipping.");
    process.exit(0);
  }

  const healData: HealDataMulti = JSON.parse(
    fs.readFileSync(healDataPath, "utf8")
  );

  if (!healData.files || healData.files.length === 0) {
    console.log("No page object files to heal. Skipping.");
    process.exit(0);
  }

  const token = process.env.GH_MODELS_TOKEN;
  if (!token) {
    console.error("GH_MODELS_TOKEN is not set. Add it as a repository secret.");
    console.error("Go to: https://github.com/<owner>/<repo>/settings/secrets/actions");
    process.exit(1);
  }

  console.log(`Total failures to heal: ${healData.totalFailures}`);
  console.log(`Page object files to fix: ${healData.files.length}`);

  const healResults: { file: string; locators: string[]; success: boolean }[] = [];

  // Process each page object file (may have multiple broken locators)
  for (const fileEntry of healData.files) {
    console.log(`\n--- Healing: ${fileEntry.pageObjectFile} ---`);
    console.log(`Broken locators: ${fileEntry.brokenLocators.join(", ")}`);

    const systemPrompt = `You are an expert Playwright test automation engineer.
Your job is to fix broken CSS selectors/locators in Page Object files.

STRICT RULES:
1. Fix ALL broken locators listed below - do not change anything else.
2. DO NOT modify method signatures, assertions, imports, or class structure.
3. DO NOT introduce XPath, waitForTimeout, or hardcoded delays.
4. DO NOT increase any timeout values.
5. Preferred locator strategy: CSS selectors with class/attribute selectors.
6. Return ONLY the complete updated TypeScript file content.
7. Do NOT include markdown code fences, explanations, or comments about changes.
8. Return raw TypeScript code only.`;

    const locatorDetails = fileEntry.brokenLocators
      .map((loc, i) => `${i + 1}. Locator: "${loc}"\n   Error: ${fileEntry.errors[i]?.substring(0, 300)}`)
      .join("\n\n");

    const userPrompt = `The following Playwright Page Object has ${fileEntry.brokenLocators.length} broken locator(s) that cause test failures.

BROKEN LOCATORS:
${locatorDetails}

CURRENT FILE (${fileEntry.pageObjectFile}):
\`\`\`typescript
${fileEntry.pageObjectContent}
\`\`\`

Fix ALL ${fileEntry.brokenLocators.length} broken locator(s) and return the complete updated file.
The website is https://automationexercise.com.
Return ONLY raw TypeScript code, no markdown fences or explanations.`;

    try {
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
        healResults.push({ file: fileEntry.pageObjectFile, locators: fileEntry.brokenLocators, success: false });
        continue;
      }

      const data = await response.json();
      let fixedCode = data.choices?.[0]?.message?.content;

      if (!fixedCode) {
        console.error(`No response for ${fileEntry.pageObjectFile}`);
        healResults.push({ file: fileEntry.pageObjectFile, locators: fileEntry.brokenLocators, success: false });
        continue;
      }

      // Clean any markdown code fences if present
      fixedCode = cleanCodeResponse(fixedCode);

      // Write the fixed file
      const filePath = path.resolve(fileEntry.pageObjectFile);
      fs.writeFileSync(filePath, fixedCode, "utf8");
      console.log(`Successfully healed: ${fileEntry.pageObjectFile}`);
      healResults.push({ file: fileEntry.pageObjectFile, locators: fileEntry.brokenLocators, success: true });

    } catch (error) {
      console.error(`Error healing ${fileEntry.pageObjectFile}:`, error);
      healResults.push({ file: fileEntry.pageObjectFile, locators: fileEntry.brokenLocators, success: false });
    }
  }

  // Write heal summary
  const summary = {
    totalFailures: healData.totalFailures,
    filesProcessed: healResults.length,
    filesHealed: healResults.filter((r) => r.success).length,
    filesFailed: healResults.filter((r) => !r.success).length,
    results: healResults,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.resolve("artifacts/heal-summary.json"),
    JSON.stringify(summary, null, 2)
  );

  console.log(`\n=== Heal Summary ===`);
  console.log(`Files healed: ${summary.filesHealed}/${summary.filesProcessed}`);

  if (summary.filesFailed > 0) {
    console.error(`${summary.filesFailed} file(s) failed to heal.`);
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
