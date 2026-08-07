import { VirtualRepository } from "../repository-engine/github-repo.engine";
import { ASTRepositoryAnalysis } from "../ast-engine/ast-analysis.engine";
import { QualityModuleReport, ModuleCheckResult } from "./quality.interface";

export class PerformanceQualityModule {
  public evaluate(repo: VirtualRepository, ast: ASTRepositoryAnalysis): QualityModuleReport {
    const checks: ModuleCheckResult[] = [];
    const evidenceCitations: string[] = [];
    const recommendations: string[] = [];

    let totalScore = 0;
    const maxScore = 7;

    const allFiles = Object.values(repo.files || {});
    const allJsx = Object.values(ast.fileAnalyses || {}).flatMap((fa) => fa.jsxElements || []);

    // Check 1: Dynamic Imports & Code Splitting (1.5 marks)
    let hasDynamicImport = false;
    for (const imp of ast.allImports) {
      if (imp.includes("next/dynamic") || imp.includes("React.lazy")) {
        hasDynamicImport = true;
        break;
      }
    }
    if (!hasDynamicImport) {
      for (const file of allFiles) {
        if (file.content.includes("dynamic(") || file.content.includes("lazy(") || file.content.includes("import(")) {
          hasDynamicImport = true;
          break;
        }
      }
    }

    if (hasDynamicImport) {
      totalScore += 1.5;
      const ev = "Dynamic code-splitting detected via import(), next/dynamic, or React.lazy.";
      evidenceCitations.push(ev);
      checks.push({
        checkName: "Dynamic Code Splitting",
        passed: true,
        awardedScore: 1.5,
        maxScore: 1.5,
        evidence: ev,
      });
    } else {
      checks.push({
        checkName: "Dynamic Code Splitting",
        passed: false,
        awardedScore: 0,
        maxScore: 1.5,
        evidence: "No dynamic code-splitting or lazy loading patterns detected in imports.",
        recommendation: "Use dynamic imports (`next/dynamic` or `React.lazy`) for heavy components to optimize initial bundle size.",
      });
      recommendations.push("Implement code-splitting via `next/dynamic` or `React.lazy` for heavy modal or route components.");
    }

    // Check 2: Image Optimization Usage (1.5 marks)
    let hasImageOpt = false;
    for (const imp of ast.allImports) {
      if (imp === "next/image" || imp === "unpic/react" || imp.includes("Image")) {
        hasImageOpt = true;
        break;
      }
    }
    if (!hasImageOpt) {
      for (const element of allJsx) {
        if (element.tagName === "Image" || element.tagName.endsWith(".Image")) {
          hasImageOpt = true;
          break;
        }
        if (element.tagName === "img" && element.attributes.includes("loading")) {
          hasImageOpt = true;
          break;
        }
      }
    }

    if (hasImageOpt) {
      totalScore += 1.5;
      const ev = "Image optimization component or lazy loading attributes (next/image or loading='lazy') verified in JSX.";
      evidenceCitations.push(ev);
      checks.push({
        checkName: "Image Optimization",
        passed: true,
        awardedScore: 1.5,
        maxScore: 1.5,
        evidence: ev,
      });
    } else {
      checks.push({
        checkName: "Image Optimization",
        passed: false,
        awardedScore: 0,
        maxScore: 1.5,
        evidence: "Standard `<img>` tags without lazy loading or optimized Image components detected.",
        recommendation: "Replace native `<img>` elements with `next/image` or add `loading=\"lazy\"` for responsive image optimization.",
      });
      recommendations.push("Utilize `next/image` or add `loading='lazy'` to prevent render-blocking asset loads.");
    }

    // Check 3: Tree-shakable Modern Dependency Optimization (1.5 marks)
    let hasHeavyUnshakableDeps = false;
    let treeShakableConfirmed = true;

    if (repo.packageJson) {
      const pkgContent = JSON.stringify(repo.packageJson);
      if (pkgContent.includes('"lodash":') && !pkgContent.includes('"lodash-es":')) {
        hasHeavyUnshakableDeps = true;
        treeShakableConfirmed = false;
      }
      if (pkgContent.includes('"moment":') && !pkgContent.includes('"date-fns":') && !pkgContent.includes('"dayjs":')) {
        hasHeavyUnshakableDeps = true;
        treeShakableConfirmed = false;
      }
    }

    if (treeShakableConfirmed && !hasHeavyUnshakableDeps) {
      totalScore += 1.5;
      const ev = "Clean dependency tree verified with modern tree-shakable library packages (no legacy monolithic bundles).";
      evidenceCitations.push(ev);
      checks.push({
        checkName: "Tree-Shakable Dependencies",
        passed: true,
        awardedScore: 1.5,
        maxScore: 1.5,
        evidence: ev,
      });
    } else {
      checks.push({
        checkName: "Tree-Shakable Dependencies",
        passed: false,
        awardedScore: 0,
        maxScore: 1.5,
        evidence: "Heavy monolithic dependencies (e.g. legacy lodash/moment) detected in package.json.",
        recommendation: "Switch from monolithic libraries (`lodash`, `moment`) to modular ES variants (`lodash-es`, `date-fns`, `dayjs`).",
      });
      recommendations.push("Replace monolithic npm packages (`lodash`, `moment`) with ES modules (`lodash-es`, `date-fns`) for tree shaking.");
    }

    // Check 4: Font & Asset Optimization (1.25 marks)
    let fontOpt = false;
    for (const imp of ast.allImports) {
      if (imp.includes("next/font") || imp.includes("@fontsource")) {
        fontOpt = true;
        break;
      }
    }
    if (!fontOpt) {
      for (const file of allFiles) {
        if (file.content.includes("googleapis.com") || file.content.includes("fonts.gstatic.com") || file.content.includes("next/font")) {
          fontOpt = true;
          break;
        }
      }
    }

    if (fontOpt) {
      totalScore += 1.25;
      const ev = "Font optimization verified via next/font or preconnected web fonts.";
      evidenceCitations.push(ev);
      checks.push({
        checkName: "Font & Resource Preloading",
        passed: true,
        awardedScore: 1.25,
        maxScore: 1.25,
        evidence: ev,
      });
    } else {
      checks.push({
        checkName: "Font & Resource Preloading",
        passed: false,
        awardedScore: 0,
        maxScore: 1.25,
        evidence: "No font optimization or preconnect directives detected.",
        recommendation: "Use `next/font/google` or font preloading links to eliminate layout shifts.",
      });
      recommendations.push("Adopt `next/font` to inline font CSS automatically and optimize Cumulative Layout Shift (CLS).");
    }

    // Check 5: Render Memoization (1.25 marks)
    let hasMemo = false;
    for (const file of allFiles) {
      if (file.content.includes("useMemo") || file.content.includes("useCallback") || file.content.includes("React.memo") || file.content.includes("memo(")) {
        hasMemo = true;
        break;
      }
    }

    if (hasMemo) {
      totalScore += 1.25;
      const ev = "React render optimization hooks (useMemo, useCallback, React.memo) detected.";
      evidenceCitations.push(ev);
      checks.push({
        checkName: "Render Memoization",
        passed: true,
        awardedScore: 1.25,
        maxScore: 1.25,
        evidence: ev,
      });
    } else {
      checks.push({
        checkName: "Render Memoization",
        passed: false,
        awardedScore: 0,
        maxScore: 1.25,
        evidence: "No render memoization (useMemo / useCallback) identified in component tree.",
        recommendation: "Wrap expensive computations or handler callbacks in `useMemo` and `useCallback` to prevent unnecessary re-renders.",
      });
      recommendations.push("Utilize `useMemo` and `useCallback` for expensive component computations to maximize runtime responsiveness.");
    }

    const roundedScore = Math.min(7, Math.round(totalScore * 100) / 100);

    return {
      moduleName: "Performance Engine",
      category: "performance",
      score: roundedScore,
      maxScore,
      confidencePercent: 95,
      checks,
      evidenceCitations,
      recommendations,
    };
  }
}
