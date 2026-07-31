"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteEngine = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class RouteEngine {
    detectRoutes(workspacePath, expectedRoutePatterns = []) {
        const detected = [];
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
        const uniqueDetected = [];
        const seen = new Set();
        for (const r of detected) {
            if (!seen.has(r.pattern)) {
                seen.add(r.pattern);
                uniqueDetected.push(r);
            }
        }
        // Compare against expected routes
        const matchedExpectedRoutes = [];
        const missingExpectedRoutes = [];
        for (const expected of expectedRoutePatterns) {
            const lowerExp = expected.toLowerCase().replace(/^\//, "");
            const isMatched = uniqueDetected.some((dr) => {
                const lowerDet = dr.pattern.toLowerCase().replace(/^\//, "");
                return lowerDet === lowerExp || lowerDet.includes(lowerExp) || lowerExp.includes(lowerDet);
            });
            if (isMatched) {
                matchedExpectedRoutes.push(expected);
            }
            else {
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
    scanNextAppRouter(currentDir, baseDir, results) {
        if (!fs.existsSync(currentDir))
            return;
        const items = fs.readdirSync(currentDir);
        for (const item of items) {
            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                if (item !== "api" && !item.startsWith("(")) {
                    this.scanNextAppRouter(fullPath, baseDir, results);
                }
                else {
                    this.scanNextAppRouter(fullPath, baseDir, results);
                }
            }
            else {
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
                }
                else if (item === "route.ts" || item === "route.js") {
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
    scanNextPagesRouter(currentDir, baseDir, results) {
        if (!fs.existsSync(currentDir))
            return;
        const items = fs.readdirSync(currentDir);
        for (const item of items) {
            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                this.scanNextPagesRouter(fullPath, baseDir, results);
            }
            else {
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
    scanReactRoutes(dir, results) {
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
                }
                catch { }
            }
        }
    }
    getAllFiles(dir, fileList = []) {
        if (!fs.existsSync(dir))
            return [];
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                if (file !== "node_modules" && file !== ".git") {
                    this.getAllFiles(filePath, fileList);
                }
            }
            else {
                fileList.push(filePath);
            }
        }
        return fileList;
    }
}
exports.RouteEngine = RouteEngine;
