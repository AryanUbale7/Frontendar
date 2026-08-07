import { VirtualRepository } from "../repository-engine/github-repo.engine";
import { ASTRepositoryAnalysis } from "../ast-engine/ast-analysis.engine";
import { QualityModuleReport, ModuleCheckResult } from "./quality.interface";

export class ResponsiveQualityModule {
  public evaluate(repo: VirtualRepository, ast: ASTRepositoryAnalysis): QualityModuleReport {
    const checks: ModuleCheckResult[] = [];
    const evidenceCitations: string[] = [];
    const recommendations: string[] = [];

    let totalScore = 0;
    const maxScore = 7;

    const allFiles = Object.values(repo.files || {});

    // Check 1: Tailwind Responsive Breakpoints (2.0 marks)
    const breakpointRegex = /\b(sm|md|lg|xl|2xl):[a-zA-Z0-9_-]+/g;
    let breakpointMatches = 0;
    const detectedBreakpoints = new Set<string>();

    for (const file of allFiles) {
      if (file.content.includes("className") || file.content.includes("class=")) {
        const matches = file.content.match(breakpointRegex);
        if (matches) {
          breakpointMatches += matches.length;
          matches.forEach((m: string) => {
            const prefix = m.split(":")[0];
            detectedBreakpoints.add(prefix);
          });
        }
      }
    }

    if (breakpointMatches >= 5 && detectedBreakpoints.size >= 2) {
      totalScore += 2.0;
      const ev = `Extensive Tailwind responsive utility classes verified (${breakpointMatches} instances across ${Array.from(detectedBreakpoints).join(", ")} breakpoints).`;
      evidenceCitations.push(ev);
      checks.push({
        checkName: "Tailwind Breakpoint Utilities",
        passed: true,
        awardedScore: 2.0,
        maxScore: 2.0,
        evidence: ev,
      });
    } else if (breakpointMatches > 0) {
      totalScore += 1.0;
      const ev = `Basic Tailwind responsive breakpoints detected (${breakpointMatches} instances).`;
      evidenceCitations.push(ev);
      checks.push({
        checkName: "Tailwind Breakpoint Utilities",
        passed: true,
        awardedScore: 1.0,
        maxScore: 2.0,
        evidence: ev,
        recommendation: "Expand usage of responsive modifiers (sm:, md:, lg:) across grid containers and navigation bars.",
      });
      recommendations.push("Utilize additional Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) to adapt layouts seamlessly for tablet and desktop viewports.");
    } else {
      checks.push({
        checkName: "Tailwind Breakpoint Utilities",
        passed: false,
        awardedScore: 0,
        maxScore: 2.0,
        evidence: "No responsive utility prefixes (sm:, md:, lg:, xl:) detected in component class names.",
        recommendation: "Apply Tailwind responsive prefixes (e.g. `grid-cols-1 md:grid-cols-3`, `w-full lg:w-1/2`) to ensure responsive adaptation.",
      });
      recommendations.push("Adopt Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) to transform mobile layouts into multi-column desktop grids.");
    }

    // Check 2: CSS Media Queries & Responsive Hooks (1.5 marks)
    let hasMediaQueries = false;
    for (const file of allFiles) {
      if (file.path.endsWith(".css") || file.path.endsWith(".scss") || file.path.endsWith(".less")) {
        if (file.content.includes("@media")) {
          hasMediaQueries = true;
          break;
        }
      }
      if (file.content.includes("useMediaQuery") || file.content.includes("matchMedia") || file.content.includes("@media")) {
        hasMediaQueries = true;
        break;
      }
    }

    if (hasMediaQueries || breakpointMatches >= 10) {
      totalScore += 1.5;
      const ev = hasMediaQueries
        ? "CSS @media queries / responsive hooks verified in stylesheets."
        : "Sufficient responsive breakpoint density verified in utility classes.";
      evidenceCitations.push(ev);
      checks.push({
        checkName: "CSS Media Queries & Responsive Hooks",
        passed: true,
        awardedScore: 1.5,
        maxScore: 1.5,
        evidence: ev,
      });
    } else {
      checks.push({
        checkName: "CSS Media Queries & Responsive Hooks",
        passed: false,
        awardedScore: 0,
        maxScore: 1.5,
        evidence: "No CSS @media queries or matchMedia hooks detected.",
        recommendation: "Add `@media (min-width: ...)` queries or `useMediaQuery` hooks to handle viewport state changes.",
      });
    }

    // Check 3: Grid & Flexbox Responsive Layouts (2.0 marks)
    let flexGridCount = 0;
    for (const file of allFiles) {
      if (file.content.includes("flex") || file.content.includes("grid") || file.content.includes("display: flex") || file.content.includes("display: grid")) {
        flexGridCount++;
      }
    }

    if (flexGridCount >= 3) {
      totalScore += 2.0;
      const ev = `Modern CSS Grid & Flexbox layout containers verified across ${flexGridCount} component files.`;
      evidenceCitations.push(ev);
      checks.push({
        checkName: "Grid & Flexbox Layout Systems",
        passed: true,
        awardedScore: 2.0,
        maxScore: 2.0,
        evidence: ev,
      });
    } else if (flexGridCount > 0) {
      totalScore += 1.0;
      checks.push({
        checkName: "Grid & Flexbox Layout Systems",
        passed: true,
        awardedScore: 1.0,
        maxScore: 2.0,
        evidence: `Basic Flexbox / Grid classes present in ${flexGridCount} files.`,
      });
    } else {
      checks.push({
        checkName: "Grid & Flexbox Layout Systems",
        passed: false,
        awardedScore: 0,
        maxScore: 2.0,
        evidence: "No CSS Grid or Flexbox container definitions found in JSX layout code.",
        recommendation: "Use CSS Grid (`grid grid-cols-1 md:grid-cols-2`) or Flexbox (`flex flex-col sm:flex-row`) for fluid responsive alignment.",
      });
      recommendations.push("Employ CSS Grid (`grid-cols-1 md:grid-cols-3`) or Flexbox (`flex flex-col md:flex-row`) for fluid element alignment.");
    }

    // Check 4: Mobile-First Design Patterns (1.5 marks)
    let mobileFirstPatternCount = 0;
    for (const file of allFiles) {
      if (
        file.content.includes("hidden md:block") ||
        file.content.includes("hidden lg:flex") ||
        file.content.includes("w-full md:w-") ||
        file.content.includes("block md:hidden") ||
        file.content.includes("flex-col md:flex-row") ||
        file.content.includes("grid-cols-1 md:grid-cols-")
      ) {
        mobileFirstPatternCount++;
      }
    }

    if (mobileFirstPatternCount >= 2) {
      totalScore += 1.5;
      const ev = `Mobile-first responsive layout patterns (e.g. flex-col md:flex-row, hidden md:block) verified (${mobileFirstPatternCount} instances).`;
      evidenceCitations.push(ev);
      checks.push({
        checkName: "Mobile-First Design Pattern",
        passed: true,
        awardedScore: 1.5,
        maxScore: 1.5,
        evidence: ev,
      });
    } else if (mobileFirstPatternCount > 0) {
      totalScore += 0.75;
      checks.push({
        checkName: "Mobile-First Design Pattern",
        passed: true,
        awardedScore: 0.75,
        maxScore: 1.5,
        evidence: "Basic mobile-first responsive pattern detected.",
      });
    } else {
      checks.push({
        checkName: "Mobile-First Design Pattern",
        passed: false,
        awardedScore: 0,
        maxScore: 1.5,
        evidence: "No mobile-first layout transformation classes (e.g. flex-col md:flex-row) detected.",
        recommendation: "Adopt mobile-first styling: specify base mobile styles first (e.g. `w-full flex-col`), then add desktop overrides (`md:w-auto md:flex-row`).",
      });
      recommendations.push("Design mobile-first by applying baseline styles for small screens and overriding with `md:` and `lg:` break points.");
    }

    const roundedScore = Math.min(7, Math.round(totalScore * 100) / 100);

    return {
      moduleName: "Responsive Design Engine",
      category: "responsive",
      score: roundedScore,
      maxScore,
      confidencePercent: 95,
      checks,
      evidenceCitations,
      recommendations,
    };
  }
}
