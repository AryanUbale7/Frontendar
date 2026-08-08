import { VirtualRepository } from "../repository-engine/github-repo.engine";
import { ASTRepositoryAnalysis } from "../ast-engine/ast-analysis.engine";

export interface TechnologyEvidence {
  technology: string;
  category: "Framework" | "Styling" | "State" | "BaaS/Backend" | "Charts/Maps" | "Library/Utility" | "Database" | "Hosting";
  detected: boolean;
  confidencePercent: number;
  evidenceCitations: string[];
}

export interface TechnologyDetectionReport {
  detectedTechnologies: TechnologyEvidence[];
  primaryFramework: string;
  technologyScore: number; // 0 to 100
  restrictedTechViolations: string[];
  missingRequiredTech: string[];
  preferredTechDetected: string[];
  unallowedTechDetected: string[];
  frameworkCompliance: { required?: string; detected: string; matched: boolean };
  databaseCompliance: { required?: string; detected: string[]; matched: boolean };
  hostingCompliance: { required?: string; detected?: string; matched: boolean };
  evidenceCitations: string[];
}

export class TechnologyEngine {
  public evaluateTechnologies(
    repo: VirtualRepository,
    ast: ASTRepositoryAnalysis,
    techRules?: {
      allowed?: string[];
      required?: string[];
      preferred?: string[];
      restricted?: string[];
      frameworkRequirements?: string;
      databaseRequirements?: string;
      hostingRequirements?: string;
    },
    deploymentUrl?: string
  ): TechnologyDetectionReport {
    const findings: TechnologyEvidence[] = [];
    const restrictedViolations: string[] = [];
    const missingRequired: string[] = [];
    const preferredDetected: string[] = [];
    const unallowedDetected: string[] = [];
    const citations: string[] = [];

    const deps = repo.packageJson?.dependencies || {};
    const devDeps = repo.packageJson?.devDependencies || {};
    const peerDeps = repo.packageJson?.peerDependencies || {};
    const allDeps = { ...deps, ...devDeps, ...peerDeps };
    const depKeys = Object.keys(allDeps).map((k) => k.toLowerCase());

    const allFiles = Object.values(repo.files || {});
    const allFilePaths = Object.keys(repo.files || {}).map((f) => f.toLowerCase());

    // Helper detector
    const checkTech = (
      name: string,
      category: TechnologyEvidence["category"],
      packages: string[],
      importPatterns: string[],
      jsxPatterns: string[] = []
    ): TechnologyEvidence => {
      let confidence = 0;
      const techCitations: string[] = [];

      // 1. Check package.json dependencies
      const matchedPkg = packages.find((p) => depKeys.includes(p.toLowerCase()));
      if (matchedPkg) {
        confidence += 50;
        techCitations.push(`package.json dependency found: "${matchedPkg}"`);
      }

      // 2. Check AST ES Imports
      const matchedImport = Array.from(ast.allImports).find((imp) =>
        importPatterns.some((pattern) => imp.toLowerCase().includes(pattern.toLowerCase()))
      );
      if (matchedImport) {
        confidence += 40;
        techCitations.push(`AST Import citation: "${matchedImport}"`);
      }

      // 3. Check CommonJS require(...) statements in source files
      if (confidence < 40) {
        for (const pattern of importPatterns) {
          const reqRegex = new RegExp(`require\\s*\\(\\s*['"]${pattern}['"]`, "i");
          for (const file of allFiles) {
            if (reqRegex.test(file.content)) {
              confidence += 40;
              techCitations.push(`CommonJS require citation: require("${pattern}") in ${file.path}`);
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
        techCitations.push(`AST JSX Tag rendered: "<${matchedJsx}>"`);
      }

      // 5. Special Heuristics for Tailwind
      if (name === "Tailwind") {
        const cssFiles = allFiles.filter((f) => f.path.endsWith(".css") || f.path.endsWith(".scss"));
        const hasTailwindDirective = cssFiles.some(
          (f) =>
            f.content.includes("@tailwind") ||
            f.content.includes('@import "tailwindcss"') ||
            f.content.includes("@import 'tailwindcss'") ||
            f.content.includes("@theme")
        );
        if (hasTailwindDirective) {
          confidence = Math.max(confidence + 50, 100);
          techCitations.push("Tailwind directive (@tailwind / @import 'tailwindcss') detected in CSS files.");
        }
      }

      // 6. Special Heuristics for TypeScript
      if (name === "TypeScript") {
        if (repo.hasTsConfig) {
          confidence = Math.max(confidence + 50, 100);
          techCitations.push("Found tsconfig.json configuration file.");
        }
        const hasTsFiles = allFiles.some((f) => f.path.endsWith(".ts") || f.path.endsWith(".tsx"));
        if (hasTsFiles) {
          confidence = Math.max(confidence + 40, 100);
          techCitations.push("TypeScript source files (.ts / .tsx) present.");
        }
      }

      const finalConfidence = Math.min(confidence, 100);

      return {
        technology: name,
        category,
        detected: finalConfidence >= 40,
        confidencePercent: finalConfidence,
        evidenceCitations: techCitations,
      };
    };

    // Standard suite of detectors
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
    findings.push(checkTech("Prisma", "Database", ["prisma", "@prisma/client"], ["@prisma/client"], []));
    findings.push(checkTech("PostgreSQL", "Database", ["pg", "pg-hstore"], ["pg"], []));
    findings.push(checkTech("MongoDB", "Database", ["mongoose", "mongodb"], ["mongoose", "mongodb"], []));
    findings.push(checkTech("Chart.js", "Charts/Maps", ["chart.js", "react-chartjs-2"], ["chart.js", "react-chartjs-2"], []));
    findings.push(checkTech("Recharts", "Charts/Maps", ["recharts"], ["recharts"], ["ResponsiveContainer", "BarChart", "LineChart"]));
    findings.push(checkTech("Leaflet", "Charts/Maps", ["leaflet", "react-leaflet"], ["leaflet", "react-leaflet"], ["MapContainer"]));
    findings.push(checkTech("Mapbox", "Charts/Maps", ["mapbox-gl", "react-map-gl"], ["mapbox-gl", "react-map-gl"], []));
    findings.push(checkTech("Framer Motion", "Library/Utility", ["framer-motion"], ["framer-motion"], ["motion.div", "AnimatePresence"]));

    // Dynamic checks for custom technologies in Blueprint allowed/required/preferred/restricted
    const customCandidates = new Set<string>();
    if (techRules?.allowed) techRules.allowed.forEach((t) => customCandidates.add(t));
    if (techRules?.required) techRules.required.forEach((t) => customCandidates.add(t));
    if (techRules?.preferred) techRules.preferred.forEach((t) => customCandidates.add(t));
    if (techRules?.restricted) techRules.restricted.forEach((t) => customCandidates.add(t));

    customCandidates.forEach((cand) => {
      const lower = cand.toLowerCase();
      if (!findings.some((f) => f.technology.toLowerCase() === lower)) {
        findings.push(checkTech(cand, "Library/Utility", [lower], [lower], []));
      }
    });

    // Determine primary framework
    let primaryFramework = "Vanilla JS/HTML";
    if (findings.find((f) => f.technology === "Next.js" && f.detected)) primaryFramework = "Next.js";
    else if (findings.find((f) => f.technology === "React" && f.detected)) primaryFramework = "React";
    else if (findings.find((f) => f.technology === "Vue" && f.detected)) primaryFramework = "Vue";
    else if (findings.find((f) => f.technology === "Angular" && f.detected)) primaryFramework = "Angular";
    else if (findings.find((f) => f.technology === "Express" && f.detected)) primaryFramework = "Node.js (Express)";

    // 1. Restricted tech checks
    if (techRules?.restricted && techRules.restricted.length > 0) {
      techRules.restricted.forEach((restricted) => {
        const found = findings.find(
          (f) => f.technology.toLowerCase().includes(restricted.toLowerCase()) && f.detected
        );
        if (found) {
          const msg = `Restricted technology detected: "${found.technology}"`;
          restrictedViolations.push(msg);
          citations.push(`VIOLATION: ${msg}`);
        }
      });
    }

    // 2. Required tech checks
    if (techRules?.required && techRules.required.length > 0) {
      techRules.required.forEach((req) => {
        const found = findings.find(
          (f) => f.technology.toLowerCase().includes(req.toLowerCase()) && f.detected
        );
        if (!found) {
          missingRequired.push(req);
          citations.push(`MISSING REQUIRED TECH: Required technology "${req}" not detected in repository.`);
        } else {
          citations.push(`PASSED REQUIRED TECH: Required technology "${req}" detected (${found.evidenceCitations[0] || "verified"}).`);
        }
      });
    }

    // 3. Preferred tech checks
    if (techRules?.preferred && techRules.preferred.length > 0) {
      techRules.preferred.forEach((pref) => {
        const found = findings.find(
          (f) => f.technology.toLowerCase().includes(pref.toLowerCase()) && f.detected
        );
        if (found) {
          preferredDetected.push(pref);
          citations.push(`PREFERRED TECH BONUS: Preferred technology "${pref}" detected.`);
        }
      });
    }

    // 4. Allowed tech validation
    if (techRules?.allowed && techRules.allowed.length > 0) {
      const allowedLower = techRules.allowed.map((t) => t.toLowerCase());
      findings
        .filter((f) => f.detected)
        .forEach((f) => {
          const isAllowed = allowedLower.some((al) => f.technology.toLowerCase().includes(al) || al.includes(f.technology.toLowerCase()));
          if (!isAllowed) {
            unallowedDetected.push(f.technology);
          }
        });
    }

    // 5. Framework Requirements Check
    const reqFramework = techRules?.frameworkRequirements;
    const fwMatched = reqFramework
      ? primaryFramework.toLowerCase().includes(reqFramework.toLowerCase())
      : true;
    const frameworkCompliance = {
      required: reqFramework,
      detected: primaryFramework,
      matched: fwMatched,
    };
    if (reqFramework) {
      citations.push(
        fwMatched
          ? `Framework Requirement PASSED: "${primaryFramework}" matches required "${reqFramework}".`
          : `Framework Requirement FAILED: Detected "${primaryFramework}" does not match required "${reqFramework}".`
      );
    }

    // 6. Database Requirements Check
    const reqDb = techRules?.databaseRequirements;
    const detectedDbs = findings
      .filter((f) => f.category === "Database" && f.detected)
      .map((f) => f.technology);
    const dbMatched = reqDb
      ? detectedDbs.some((db) => db.toLowerCase().includes(reqDb.toLowerCase())) ||
        depKeys.some((k) => k.includes(reqDb.toLowerCase()))
      : true;
    const databaseCompliance = {
      required: reqDb,
      detected: detectedDbs,
      matched: dbMatched,
    };
    if (reqDb) {
      citations.push(
        dbMatched
          ? `Database Requirement PASSED: Detected database matching "${reqDb}".`
          : `Database Requirement FAILED: Required database "${reqDb}" not detected in dependencies/source.`
      );
    }

    // 7. Hosting Requirements Check
    const reqHost = techRules?.hostingRequirements;
    let detectedHost = "Unknown";
    if (deploymentUrl) {
      if (deploymentUrl.includes("vercel.app")) detectedHost = "Vercel";
      else if (deploymentUrl.includes("netlify.app")) detectedHost = "Netlify";
      else if (deploymentUrl.includes("render.com")) detectedHost = "Render";
      else if (deploymentUrl.includes("github.io")) detectedHost = "GitHub Pages";
      else detectedHost = "Web Host";
    }
    if (allFilePaths.some((p) => p.includes("vercel.json"))) detectedHost = "Vercel";
    if (allFilePaths.some((p) => p.includes("netlify.toml"))) detectedHost = "Netlify";
    if (allFilePaths.some((p) => p.includes("dockerfile"))) detectedHost = "Docker";

    const hostMatched = reqHost
      ? detectedHost.toLowerCase().includes(reqHost.toLowerCase()) || (deploymentUrl ? true : false)
      : true;
    const hostingCompliance = {
      required: reqHost,
      detected: detectedHost,
      matched: hostMatched,
    };

    // Calculate Technology Score (0 to 100)
    let score = 100;
    if (restrictedViolations.length > 0) score -= 40 * restrictedViolations.length;
    if (missingRequired.length > 0) score -= 25 * missingRequired.length;
    if (!fwMatched) score -= 20;
    if (!dbMatched) score -= 15;
    if (preferredDetected.length > 0) score += 5 * preferredDetected.length;

    return {
      detectedTechnologies: findings.filter((f) => f.detected),
      primaryFramework,
      technologyScore: Math.max(0, Math.min(100, score)),
      restrictedTechViolations: restrictedViolations,
      missingRequiredTech: missingRequired,
      preferredTechDetected: preferredDetected,
      unallowedTechDetected: unallowedDetected,
      frameworkCompliance,
      databaseCompliance,
      hostingCompliance,
      evidenceCitations: citations,
    };
  }
}
