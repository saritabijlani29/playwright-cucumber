import fs from 'fs';
import { chromium } from 'playwright';

const FAILURE_FILE = 'healing-context.json';
const ENDPOINT = "https://models.inference.ai.azure.com/chat/completions";

async function run() {

  if (!fs.existsSync(FAILURE_FILE)) {
    console.log("No healing context found");
    process.exit(0);
  }

  const context = JSON.parse(fs.readFileSync(FAILURE_FILE, 'utf8'));
  const featurePath = context.feature;

  const original = fs.readFileSync(featurePath, 'utf8');
  const locators = extractLocators(original);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(process.env.BASE_URL || 'http://localhost');

  const dom = await page.content();
  const broken: string[] = [];

  for (const locator of locators) {
    try {
      const count = await page.locator(locator).count();
      if (count === 0) broken.push(locator);
    } catch {
      broken.push(locator);
    }
  }

  await browser.close();

  if (broken.length === 0) {
    console.log("No broken locators detected.");
    process.exit(0);
  }

  let updated = original;

  for (const oldLocator of broken) {
    const healed = await healWithCopilot(oldLocator, dom);
    if (!healed) continue;

    if (confidenceScore(oldLocator, healed) < 0.5) continue;

    updated = updated.replaceAll(oldLocator, healed);
  }

  fs.writeFileSync(featurePath, updated);
}

function extractLocators(content: string): string[] {
  const regex = /"(.*?)"/g;
  return [...content.matchAll(regex)]
    .map(m => m[1])
    .filter(v => v.includes('#') || v.includes('.') || v.includes('//'));
}

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

async function healWithCopilot(broken: string, dom: string) {

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GH_MODELS_TOKEN}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `
Broken locator:
${broken}

Relevant DOM:
${dom.slice(0, 12000)}

Prefer getByRole, getByText , data-testid, aria-label, role.
Avoid brittle CSS chains.
Return only locator.
Return ONLY raw TypeScript code, no markdown fences or explanations.
`
        }
      ]
    })
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim()?.replace(/["']/g, '');
}

function confidenceScore(oldL: string, newL: string) {
  if (newL.includes('data-testid')) return 0.9;
  if (newL.includes('aria')) return 0.8;
  if (newL.length < oldL.length) return 0.6;
  return 0.3;
}

run();