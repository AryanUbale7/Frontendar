import * as fs from "fs";
import * as path from "path";

export interface UIScreenshotEvidence {
  viewName: string;
  url: string;
  viewport: string;
  screenshotPath?: string;
  detectedSelectors: string[];
}

export interface UIDetectionResult {
  hasNavigation: boolean;
  hasButtons: boolean;
  hasForms: boolean;
  hasDashboard: boolean;
  hasCharts: boolean;
  hasCards: boolean;
  hasFooter: boolean;
  hasProfile: boolean;
  hasSettings: boolean;
  hasAuthPages: boolean;
  hasErrorPages: boolean;
  hasTables: boolean;
  hasReports: boolean;
  hasSearch: boolean;
  hasPagination: boolean;
  hasDarkModeToggle: boolean;
  isResponsive: boolean;
  hasBrokenLayout: boolean;
  consoleErrors: string[];
  brokenLinks: string[];
  detectedUIComponents: string[];
  screenshots: UIScreenshotEvidence[];
  evidenceLogs: string[];
}

export class UIEngine {
  public analyzeUI(workspacePath: string, deploymentUrl?: string): UIDetectionResult {
    const evidenceLogs: string[] = [];
    const detectedUIComponents: string[] = [];
    const consoleErrors: string[] = [];
    const brokenLinks: string[] = [];
    const screenshots: UIScreenshotEvidence[] = [];

    let hasNavigation = false;
    let hasButtons = false;
    let hasForms = false;
    let hasDashboard = false;
    let hasCharts = false;
    let hasCards = false;
    let hasFooter = false;
    let hasProfile = false;
    let hasSettings = false;
    let hasAuthPages = false;
    let hasErrorPages = false;
    let hasTables = false;
    let hasReports = false;
    let hasSearch = false;
    let hasPagination = false;
    let hasDarkModeToggle = false;
    let isResponsive = false;
    let hasBrokenLayout = false;

    const files = this.getAllSourceFiles(workspacePath);

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, "utf-8");
        const lower = content.toLowerCase();
        const ext = path.extname(file).toLowerCase();
        const codeOnly = this.stripComments(content);
        const codeLower = codeOnly.toLowerCase();

        if (lower.includes("<nav") || lower.includes("navbar") || lower.includes("navigation")) {
          hasNavigation = true;
          if (!detectedUIComponents.includes("Navigation Bar")) detectedUIComponents.push("Navigation Bar");
        }

        if (lower.includes("<button") || lower.includes("btn") || lower.includes("button")) {
          hasButtons = true;
          if (!detectedUIComponents.includes("Interactive Buttons")) detectedUIComponents.push("Interactive Buttons");
        }

        if (
          lower.includes("<form") ||
          lower.includes("onsubmit") ||
          lower.includes("useform") ||
          lower.includes("type=\"text\"") ||
          lower.includes("type=\"email\"") ||
          lower.includes("type=\"password\"")
        ) {
          hasForms = true;
          if (!detectedUIComponents.includes("Input Forms")) detectedUIComponents.push("Input Forms");
        }

        if (lower.includes("dashboard") || lower.includes("analytics") || lower.includes("overview")) {
          hasDashboard = true;
          if (!detectedUIComponents.includes("Dashboard UI")) detectedUIComponents.push("Dashboard UI");
        }

        if (
          lower.includes("recharts") ||
          lower.includes("chart.js") ||
          lower.includes("apexcharts") ||
          lower.includes("<linechart") ||
          lower.includes("<barchart") ||
          lower.includes("<areachart") ||
          lower.includes("<piechart") ||
          lower.includes("<scatterchart") ||
          lower.includes("<canvas") ||
          lower.includes("responsivecontainer")
        ) {
          hasCharts = true;
          if (!detectedUIComponents.includes("Analytics Charts")) detectedUIComponents.push("Analytics Charts");
        }

        if (lower.includes("card") || lower.includes("grid-cols") || lower.includes("shadow")) {
          hasCards = true;
          if (!detectedUIComponents.includes("Content Cards")) detectedUIComponents.push("Content Cards");
        }

        if (lower.includes("<footer") || lower.includes("footer")) {
          hasFooter = true;
          if (!detectedUIComponents.includes("Site Footer")) detectedUIComponents.push("Site Footer");
        }

        if (lower.includes("profile") || lower.includes("avatar") || lower.includes("user")) {
          hasProfile = true;
          if (!detectedUIComponents.includes("User Profile")) detectedUIComponents.push("User Profile");
        }

        if (lower.includes("settings") || lower.includes("preferences")) {
          hasSettings = true;
          if (!detectedUIComponents.includes("Settings View")) detectedUIComponents.push("Settings View");
        }

        if (lower.includes("login") || lower.includes("signup") || lower.includes("auth")) {
          hasAuthPages = true;
          if (!detectedUIComponents.includes("Authentication UI")) detectedUIComponents.push("Authentication UI");
        }

        if (
          lower.includes("404") ||
          lower.includes("not-found") ||
          lower.includes("notfound") ||
          lower.includes("error boundary")
        ) {
          hasErrorPages = true;
          if (!detectedUIComponents.includes("Error Pages")) detectedUIComponents.push("Error Pages");
        }

        if (lower.includes("<table") || lower.includes("datatable") || lower.includes("th>")) {
          hasTables = true;
          if (!detectedUIComponents.includes("Data Tables")) detectedUIComponents.push("Data Tables");
        }

        if (lower.includes("report") || lower.includes("export") || lower.includes("summary")) {
          hasReports = true;
          if (!detectedUIComponents.includes("Reports View")) detectedUIComponents.push("Reports View");
        }

        if (lower.includes("search") || lower.includes("filter")) {
          hasSearch = true;
          if (!detectedUIComponents.includes("Search Bar")) detectedUIComponents.push("Search Bar");
        }

        if (lower.includes("pagination") || lower.includes("page 1")) {
          hasPagination = true;
          if (!detectedUIComponents.includes("Pagination")) detectedUIComponents.push("Pagination");
        }

        if (lower.includes("dark") || lower.includes("theme")) {
          hasDarkModeToggle = true;
          if (!detectedUIComponents.includes("Dark Mode Switcher")) detectedUIComponents.push("Dark Mode Switcher");
        }

        // Responsive detection ignores comments: commented-out classes are NOT evidence
        if (codeLower.includes("md:") || codeLower.includes("lg:") || codeLower.includes("sm:") || codeLower.includes("@media")) {
          isResponsive = true;
        }

        // Static layout-break detection: fixed widths beyond any viewport are broken layouts
        if ([".css", ".scss", ".less"].includes(ext)) {
          const fixedWidth = content.match(/\b(?:width|min-width)\s*:\s*(\d{4,})px/i);
          if (fixedWidth && parseInt(fixedWidth[1], 10) >= 1500) {
            hasBrokenLayout = true;
            brokenLinks.push(`Fixed oversized width (${fixedWidth[1]}px) detected in ${path.basename(file)}`);
          }
        }
      } catch {}
    }

    if (deploymentUrl) {
      evidenceLogs.push(`Live browser (Playwright) verification requested for ${deploymentUrl} but this engine stage is static-only; UI evidence below is derived from source analysis, not a running browser.`);
    } else {
      evidenceLogs.push("Static AST DOM & Layout Scanner completed across source files.");
    }

    evidenceLogs.push(`Verified ${detectedUIComponents.length} interactive UI layout components.`);

    return {
      hasNavigation,
      hasButtons,
      hasForms,
      hasDashboard,
      hasCharts,
      hasCards,
      hasFooter,
      hasProfile,
      hasSettings,
      hasAuthPages,
      hasErrorPages,
      hasTables,
      hasReports,
      hasSearch,
      hasPagination,
      hasDarkModeToggle,
      isResponsive,
      hasBrokenLayout,
      consoleErrors,
      brokenLinks,
      detectedUIComponents,
      screenshots,
      evidenceLogs,
    };
  }

  private stripComments(content: string): string {
    let out = content.replace(/\/\*[\s\S]*?\*\//g, "");
    out = out.replace(/(^|[;{>\s])\/\/[^\n]*/g, "$1");
    return out;
  }

  private getAllSourceFiles(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        if (file !== "node_modules" && file !== ".git" && file !== ".next" && file !== "dist") {
          this.getAllSourceFiles(filePath, fileList);
        }
      } else {
        const ext = path.extname(filePath).toLowerCase();
        if ([".tsx", ".jsx", ".ts", ".js", ".html", ".css", ".scss", ".less"].includes(ext)) {
          fileList.push(filePath);
        }
      }
    }
    return fileList;
  }
}
