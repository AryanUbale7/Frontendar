import { VirtualRepository } from "../repository-engine/github-repo.engine";
import { ASTRepositoryAnalysis } from "../ast-engine/ast-analysis.engine";

export interface TechnologyEvidence {
  technology: string;
  category: "Framework" | "Styling" | "State" | "BaaS/Backend" | "Charts/Maps" | "Library/Utility";
  detected: boolean;
  confidencePercent: number;
  evidenceCitations: string[];
}

export interface TechnologyDetectionReport {
  detectedTechnologies: TechnologyEvidence[];
  primaryFramework: string;
  technologyScore: number; // 0 to 100
  restrictedTechViolations: string[];
}

export class TechnologyEngine {
  public evaluateTechnologies(
    repo: VirtualRepository,
    ast: ASTRepositoryAnalysis,
    techRules?: { allowed?: string[]; required?: string[]; restricted?: string[] }
  ): TechnologyDetectionReport {
    const findings: TechnologyEvidence[] = [];
    const restrictedViolations: string[] = [];

    const deps = repo.packageJson?.dependencies || {};
    const devDeps = repo.packageJson?.devDependencies || {};
    const peerDeps = repo.packageJson?.peerDependencies || {};
    const allDeps = { ...deps, ...devDeps, ...peerDeps };
    const depKeys = Object.keys(allDeps).map((k) => k.toLowerCase());

    const allFiles = Object.values(repo.files || {});

    // Helper detector
    const checkTech = (
      name: string,
      category: TechnologyEvidence["category"],
      packages: string[],
      importPatterns: string[],
      jsxPatterns: string[] = []
    ): TechnologyEvidence => {
      let confidence = 0;
      const citations: string[] = [];

      // 1. Check package.json dependencies
      const matchedPkg = packages.find((p) => depKeys.includes(p.toLowerCase()));
      if (matchedPkg) {
        confidence += 50;
        citations.push(`package.json dependency found: "${matchedPkg}"`);
      }

      // 2. Check AST ES Imports
      const matchedImport = Array.from(ast.allImports).find((imp) =>
        importPatterns.some((pattern) => imp.toLowerCase().includes(pattern.toLowerCase()))
      );
      if (matchedImport) {
        confidence += 40;
        citations.push(`AST Import citation: "${matchedImport}"`);
      }

      // 3. Check CommonJS require(...) statements in source files
      if (confidence < 40) {
        for (const pattern of importPatterns) {
          const reqRegex = new RegExp(`require\\s*\\(\\s*['"]${pattern}['"]`, "i");
          for (const file of allFiles) {
            if (reqRegex.test(file.content)) {
              confidence += 40;
              citations.push(`CommonJS require citation: require("${pattern}") in ${file.path}`);
              break;
            }
          }
          if (confidence >= 40) break;
        }
      }

      // 4. Check AST JSX Tags
      const matchedJsx = Array.from(ast.allJsxTags).find((tag) =>
        jsxPatterns.some((pattern) => tag.toLowerCase() === pattern.toLowerCase())
      );
      if (matchedJsx) {
        confidence += 20;
        citations.push(`AST JSX Tag rendered: "<${matchedJsx}>"`);
      }

      // 5. Special Heuristics for Tailwind
      if (name === "Tailwind") {
        const cssFiles = allFiles.filter((f) => f.path.endsWith(".css") || f.path.endsWith(".scss"));
        const hasTailwindDirective = cssFiles.some((f) =>
          f.content.includes("@tailwind") ||
          f.content.includes('@import "tailwindcss"') ||
          f.content.includes("@import 'tailwindcss'") ||
          f.content.includes("@theme")
        );
        if (hasTailwindDirective) {
          confidence = Math.max(confidence + 50, 100);
          citations.push("Tailwind directive (@tailwind / @import 'tailwindcss') detected in CSS files.");
        }
      }

      // 6. Special Heuristics for TypeScript
      if (name === "TypeScript") {
        if (repo.hasTsConfig) {
          confidence = Math.max(confidence + 50, 100);
          citations.push("Found tsconfig.json configuration file.");
        }
        const hasTsFiles = allFiles.some((f) => f.path.endsWith(".ts") || f.path.endsWith(".tsx"));
        if (hasTsFiles) {
          confidence = Math.max(confidence + 40, 100);
          citations.push("TypeScript source files (.ts / .tsx) present.");
        }
      }

      const finalConfidence = Math.min(confidence, 100);

      return {
        technology: name,
        category,
        detected: finalConfidence >= 40,
        confidencePercent: finalConfidence,
        evidenceCitations: citations
      };
    };

    // Evaluate standard tech suite
    findings.push(checkTech("React", "Framework", ["react", "react-dom"], ["react", "react-dom"], []));
    findings.push(checkTech("Next.js", "Framework", ["next"], ["next/router", "next/navigation", "next/image", "next/font", "next/link"], []));
    findings.push(checkTech("Vue", "Framework", ["vue", "@vue/runtime-core"], ["vue"], []));
    findings.push(checkTech("Angular", "Framework", ["@angular/core"], ["@angular/core"], []));
    findings.push(checkTech("TypeScript", "Library/Utility", ["typescript"], ["typescript"], []));
    findings.push(checkTech("Tailwind", "Styling", ["tailwindcss", "@tailwindcss/postcss", "@tailwindcss/vite"], ["tailwindcss"], []));
    findings.push(checkTech("Bootstrap", "Styling", ["bootstrap"], ["bootstrap"], []));
    findings.push(checkTech("Material UI", "Styling", ["@mui/material"], ["@mui/material"], ["Button", "TextField"]));
    findings.push(checkTech("Redux", "State", ["redux", "@reduxjs/toolkit", "react-redux"], ["@reduxjs/toolkit", "react-redux", "redux"], []));
    findings.push(checkTech("Zustand", "State", ["zustand"], ["zustand"], []));
    findings.push(checkTech("Firebase", "BaaS/Backend", ["firebase"], ["firebase/app", "firebase/auth", "firebase/firestore"], []));
    findings.push(checkTech("Supabase", "BaaS/Backend", ["@supabase/supabase-js"], ["@supabase/supabase-js"], []));
    findings.push(checkTech("Express", "BaaS/Backend", ["express"], ["express"], []));
    findings.push(checkTech("Chart.js", "Charts/Maps", ["chart.js", "react-chartjs-2"], ["chart.js", "react-chartjs-2"], []));
    findings.push(checkTech("Recharts", "Charts/Maps", ["recharts"], ["recharts"], ["ResponsiveContainer", "BarChart", "LineChart"]));
    findings.push(checkTech("Leaflet", "Charts/Maps", ["leaflet", "react-leaflet"], ["leaflet", "react-leaflet"], ["MapContainer"]));
    findings.push(checkTech("Mapbox", "Charts/Maps", ["mapbox-gl", "react-map-gl"], ["mapbox-gl", "react-map-gl"], []));
    findings.push(checkTech("Framer Motion", "Library/Utility", ["framer-motion"], ["framer-motion"], ["motion.div", "AnimatePresence"]));

    // Determine primary framework
    let primaryFramework = "Vanilla JS/HTML";
    if (findings.find((f) => f.technology === "Next.js" && f.detected)) primaryFramework = "Next.js";
    else if (findings.find((f) => f.technology === "React" && f.detected)) primaryFramework = "React";
    else if (findings.find((f) => f.technology === "Vue" && f.detected)) primaryFramework = "Vue";
    else if (findings.find((f) => f.technology === "Angular" && f.detected)) primaryFramework = "Angular";
    else if (findings.find((f) => f.technology === "Express" && f.detected)) primaryFramework = "Node.js (Express)";

    // Restricted tech checks
    if (techRules?.restricted && techRules.restricted.length > 0) {
      techRules.restricted.forEach((restricted) => {
        const found = findings.find((f) => f.technology.toLowerCase() === restricted.toLowerCase() && f.detected);
        if (found) {
          restrictedViolations.push(`Restricted technology detected: "${found.technology}"`);
        }
      });
    }

    // Technology Score Calculation
    let score = 100;
    if (restrictedViolations.length > 0) {
      score -= 50 * restrictedViolations.length;
    }

    if (techRules?.required && techRules.required.length > 0) {
      techRules.required.forEach((req) => {
        const found = findings.find((f) => f.technology.toLowerCase() === req.toLowerCase() && f.detected);
        if (!found) {
          score -= 20;
        }
      });
    }

    return {
      detectedTechnologies: findings.filter((f) => f.detected),
      primaryFramework,
      technologyScore: Math.max(0, score),
      restrictedTechViolations: restrictedViolations
    };
  }
}
