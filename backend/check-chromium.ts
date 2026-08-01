import playwright from "playwright";
import fs from "fs";

async function main() {
  try {
    const path = playwright.chromium.executablePath();
    console.log("Playwright chromium executable path:", path);
    const exists = fs.existsSync(path);
    console.log("Executable exists:", exists);
  } catch (e: any) {
    console.error("Error retrieving Chromium path:", e.message);
  }
}
main();
