import * as fs from "fs";
import * as path from "path";

export interface DetectedRoute {
  pattern: string;
  type: "page" | "api";
  routerType: "Next.js App Router" | "Next.js Pages Router" | "React Router" | "Vue Router" | "Angular Routes" | "Static HTML";
  filePath: string;
}

export interface RouteMappingResult {
  detectedRoutes: DetectedRoute[];
  coveragePercent: number;
  matchedExpectedRoutes: string[];
  missingExpectedRoutes: string[];
}

export class RouteEngine {
  public detectRoutes(workspacePath: string, expectedRoutePatterns: string[] = []): RouteMappingResult {
    const detected: DetectedRoute[] = [];

    // 1. Next.js App Router
    const appDir = path.join(workspacePath, "app");
    if (fs.existsSync(appDir)) {
      this.scanNextAppRouter(appDir, appDir, detected);
    }

    // 2. Next.js Pages Router
    const pagesDir = path.join(workspacePath, "pages");
    if (fs.existsSync(pagesDir)) {
      this.scanNextPagesRouter(pagesDir, pagesDir, detected);
    }

    // 3. React Router or Static HTML Router
    const srcDir = path.join(workspacePath, "src");
    if (fs.existsSync(srcDir)) {
      this.scanReactRoutes(srcDir, detected);
    }

    // Deduplicate patterns
    const uniqueDetected: DetectedRoute[] = [];
    const seen = new Set<string>();

    for (const r of detected) {
      if (!seen.has(r.pattern)) {
        seen.add(r.pattern);
        uniqueDetected.push(r);
      }
    }

    // Compare against expected routes
    const matchedExpectedRoutes: string[] = [];
    const missingExpectedRoutes: string[] = [];

    for (const expected of expectedRoutePatterns) {
      const lowerExp = expected.toLowerCase().replace(/^\//, "");
      const isMatched = uniqueDetected.some((dr) => {
        const lowerDet = dr.pattern.toLowerCase().replace(/^\//, "");
        return lowerDet === lowerExp || lowerDet.includes(lowerExp) || lowerExp.includes(lowerDet);
      });

      if (isMatched) {
        matchedExpectedRoutes.push(expected);
      } else {
        missingExpectedRoutes.push(expected);
      }
    }

    const totalExpected = expectedRoutePatterns.length || 1;
    const coveragePercent = Math.round((matchedExpectedRoutes.length / totalExpected) * 100);

    return {
      detectedRoutes: uniqueDetected,
      coveragePercent: expectedRoutePatterns.length > 0 ? coveragePercent : 100,
      matchedExpectedRoutes,
      missingExpectedRoutes,
    };
  }

  private scanNextAppRouter(currentDir: string, baseDir: string, results: DetectedRoute[]): void {
    if (!fs.existsSync(currentDir)) return;
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (item !== "api" && !item.startsWith("(")) {
          this.scanNextAppRouter(fullPath, baseDir, results);
        } else {
          this.scanNextAppRouter(fullPath, baseDir, results);
        }
      } else {
        if (item === "page.tsx" || item === "page.jsx" || item === "page.js") {
          let routePath = path.relative(baseDir, currentDir).replace(/\\/g, "/");
          routePath = routePath.replace(/\([^)]+\)\/?/g, ""); // strip route groups (dashboard)
          const pattern = "/" + (routePath === "" ? "" : routePath);
          results.push({
            pattern,
            type: "page",
            routerType: "Next.js App Router",
            filePath: fullPath,
          });
        } else if (item === "route.ts" || item === "route.js") {
          const routePath = path.relative(baseDir, currentDir).replace(/\\/g, "/");
          results.push({
            pattern: "/api/" + routePath,
            type: "api",
            routerType: "Next.js App Router",
            filePath: fullPath,
          });
        }
      }
    }
  }

  private scanNextPagesRouter(currentDir: string, baseDir: string, results: DetectedRoute[]): void {
    if (!fs.existsSync(currentDir)) return;
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        this.scanNextPagesRouter(fullPath, baseDir, results);
      } else {
        const ext = path.extname(item);
        if ([".tsx", ".jsx", ".js", ".ts"].includes(ext) && !item.startsWith("_")) {
          const rel = path.relative(baseDir, fullPath).replace(/\\/g, "/");
          const routePath = rel.replace(ext, "").replace(/\/index$/, "");
          const isApi = rel.startsWith("api/");
          results.push({
            pattern: "/" + (routePath === "index" ? "" : routePath),
            type: isApi ? "api" : "page",
            routerType: "Next.js Pages Router",
            filePath: fullPath,
          });
        }
      }
    }
  }

  private scanReactRoutes(dir: string, results: DetectedRoute[]): void {
    const files = this.getAllFiles(dir);
    for (const file of files) {
      if (file.endsWith(".tsx") || file.endsWith(".jsx") || file.endsWith(".js")) {
        try {
          const content = fs.readFileSync(file, "utf-8");
          const routeRegex = /<Route\s+[^>]*path=["']([^"']+)["']/g;
          let match;
          while ((match = routeRegex.exec(content)) !== null) {
            results.push({
              pattern: match[1],
              type: "page",
              routerType: "React Router",
              filePath: file,
            });
          }
        } catch {}
      }
    }
  }

  private getAllFiles(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return [];
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        if (file !== "node_modules" && file !== ".git") {
          this.getAllFiles(filePath, fileList);
        }
      } else {
        fileList.push(filePath);
      }
    }
    return fileList;
  }
}
