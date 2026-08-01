process.env.PLAYWRIGHT_BROWSERS_PATH = "0";
import fs from "fs";

async function main() {
  try {
    const playwright = require("playwright");
    const path = playwright.chromium.executablePath();
    console.log("Playwright chromium executable path:", path);
    const exists = fs.existsSync(path);
    console.log("Executable exists:", exists);

    if (exists) {
      console.log("Attempting to launch Chromium headlessly...");
      const browser = await playwright.chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
      });
      console.log("Chromium successfully launched!");
      await browser.close();
      console.log("Browser closed successfully.");
    }
  } catch (e: any) {
    console.error("Error launching Chromium:", e.message);
  }
}
main();
