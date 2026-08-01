process.env.PLAYWRIGHT_BROWSERS_PATH = "0";
import fs from "fs";

async function main() {
  let chrome: any = null;
  try {
    const playwright = require("playwright");
    const chromiumPath = playwright.chromium.executablePath();
    console.log("[Lighthouse] Chromium path:", chromiumPath);
    const exists = fs.existsSync(chromiumPath);
    console.log("[Lighthouse] Chromium exists:", exists);

    if (!exists) {
      console.error("[Lighthouse] ERROR: binary not found – BROWSER_BINARY_MISSING");
      return;
    }

    const chromeLauncher = require("chrome-launcher");
    const lhModule = require("lighthouse");
    const lighthouse = typeof lhModule === "function" ? lhModule : (lhModule.default ?? lhModule.lighthouse ?? lhModule);

    console.log("[Lighthouse] Launching Chromium...");
    chrome = await chromeLauncher.launch({
      chromePath: chromiumPath,
      chromeFlags: [
        "--headless",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ]
    });
    console.log("[Lighthouse] Chromium ready on port", chrome.port);

    const targetUrl = "https://care-scope-analytics-ten.vercel.app/";
    console.log("[Lighthouse] Target:", targetUrl);
    console.log("[Lighthouse] Starting audit...");
    const startTime = Date.now();

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("LIGHTHOUSE_EXECUTION_TIMEOUT")), 120000)
    );

    const auditPromise = lighthouse(targetUrl, {
      port: chrome.port,
      output: "json",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"]
    });

    const runnerResult = await Promise.race([auditPromise, timeoutPromise]);
    const lhr = (runnerResult as any).lhr;
    const duration = Date.now() - startTime;

    console.log(`[Lighthouse] Audit completed in ${duration}ms`);
    console.log("[Lighthouse] Performance:", Math.round((lhr.categories.performance.score ?? 0) * 100));
    console.log("[Lighthouse] Accessibility:", Math.round((lhr.categories.accessibility.score ?? 0) * 100));
    console.log("[Lighthouse] Best Practices:", Math.round((lhr.categories["best-practices"]?.score ?? 0) * 100));
    console.log("[Lighthouse] SEO:", Math.round((lhr.categories.seo.score ?? 0) * 100));
  } catch (e: any) {
    console.error("[Lighthouse] FAILED:", e.message);
  } finally {
    if (chrome) {
      await chrome.kill();
      console.log("[Lighthouse] Chromium closed");
    }
  }
}
main();
