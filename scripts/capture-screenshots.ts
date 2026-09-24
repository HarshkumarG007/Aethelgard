import { chromium } from "@playwright/test";
import path from "node:path";
import fs from "node:fs/promises";

async function captureSanctuaryScreenshots() {
  const outputDir = path.resolve(process.cwd(), "docs/assets/screenshots");
  await fs.mkdir(outputDir, { recursive: true });

  console.log("[SCREENSHOT] Launching browser for sanctuary tour...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    colorScheme: "dark",
  });
  const page = await context.newPage();

  // 1. Threshold Portal Auth Page
  console.log("[1/8] Capturing Threshold Auth Portal...");
  await page.goto("http://localhost:3000/auth", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outputDir, "01_threshold_portal.png") });

  // 2. Authenticate through Threshold Form
  console.log("[AUTH] Submitting admin passphrase through threshold...");
  const input = page.locator('input[type="password"]');
  await input.fill("aethelgard-admin-dev-passphrase-2026");

  const [verifyRes] = await Promise.all([
    page.waitForResponse((res) => res.url().includes("/api/auth/verify"), { timeout: 15000 }),
    input.press("Enter"),
  ]);
  console.log(`[AUTH] Response status: ${verifyRes.status()}`);
  const verifyData = await verifyRes.json();
  console.log("[AUTH] Response data:", verifyData);

  await page.waitForTimeout(1000);
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // 3. Upper Archive Overview
  console.log("[2/8] Capturing Upper Archive Overview...");
  await page.screenshot({ path: path.join(outputDir, "02_upper_archive_overview.png") });

  // 4. Ambient Soundscape Popover
  console.log("[3/8] Capturing Ambient Soundscape Popover...");
  const soundBtn = page.locator('button[aria-label*="Soundscape"]');
  if (await soundBtn.isVisible()) {
    await soundBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outputDir, "03_ambient_soundscape.png") });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }

  // 5. Memory Composer Modal
  console.log("[4/8] Capturing Memory Composer Modal...");
  const inscribeBtn = page.locator('button:has-text("Inscribe")');
  if (await inscribeBtn.isVisible()) {
    await inscribeBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outputDir, "04_memory_composer_modal.png") });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
  }

  // 6. Correspondence & Spoken Letters Chamber
  console.log("[5/8] Capturing Correspondence & Letters...");
  await page.goto("http://localhost:3000/letters", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, "05_correspondence_chamber.png") });

  // 7. Memory Vault
  console.log("[6/8] Capturing Memory Vault...");
  await page.goto("http://localhost:3000/archive", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, "06_memory_vault.png") });

  // 8. Memory Deep View with Refine / Remove Controls
  console.log("[7/8] Capturing Memory Deep View...");
  const firstCardLink = page.locator('article a[href*="/memory/"]').first();
  if (await firstCardLink.isVisible()) {
    await firstCardLink.click();
    await page.waitForURL(/\/memory\/.+/, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outputDir, "07_memory_deepview.png") });
  }

  // 9. Horizon Chamber
  console.log("[8/8] Capturing Horizon Promises...");
  await page.goto("http://localhost:3000/horizon", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, "08_horizon_promises.png") });

  console.log("[SUCCESS] All sanctuary screenshots captured successfully into docs/assets/screenshots/!");
  await browser.close();
}

captureSanctuaryScreenshots().catch((err) => {
  console.error("[FATAL] Screenshot capture failed:", err);
  process.exit(1);
});
