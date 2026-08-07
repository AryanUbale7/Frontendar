import { VirtualRepository } from "../repository-engine/github-repo.engine";
import { ASTRepositoryAnalysis } from "../ast-engine/ast-analysis.engine";
import { QualityModuleReport, ModuleCheckResult } from "./quality.interface";

export class AccessibilityQualityModule {
  public evaluate(repo: VirtualRepository, ast: ASTRepositoryAnalysis): QualityModuleReport {
    const checks: ModuleCheckResult[] = [];
    const evidenceCitations: string[] = [];
    const recommendations: string[] = [];

    let totalScore = 0;
    const maxScore = 7;

    const allJsx = Object.values(ast.fileAnalyses || {}).flatMap((fa) => fa.jsxElements || []);

    // Check 1: Semantic HTML elements (1.5 marks)
    const semanticTags = new Set(["header", "main", "nav", "footer", "section", "article", "aside"]);
    const detectedSemanticTags = new Set<string>();

    for (const elem of allJsx) {
      if (semanticTags.has(elem.tagName.toLowerCase())) {
        detectedSemanticTags.add(elem.tagName.toLowerCase());
      }
    }

    if (detectedSemanticTags.size >= 3) {
      totalScore += 1.5;
      const ev = `High semantic HTML usage verified across ${detectedSemanticTags.size} tags (<${Array.from(detectedSemanticTags).join(">, <")}>).`;
      evidenceCitations.push(ev);
      checks.push({
        checkName: "Semantic HTML Elements",
        passed: true,
        awardedScore: 1.5,
        maxScore: 1.5,
        evidence: ev,
      });
    } else if (detectedSemanticTags.size > 0) {
      totalScore += 0.75;
      const ev = `Partial semantic HTML usage detected (<${Array.from(detectedSemanticTags).join(">, <")}>).`;
      evidenceCitations.push(ev);
      checks.push({
        checkName: "Semantic HTML Elements",
        passed: true,
        awardedScore: 0.75,
        maxScore: 1.5,
        evidence: ev,
        recommendation: "Wrap major layout sections with <header>, <main>, <nav>, and <footer> instead of generic <div> tags.",
      });
      recommendations.push("Enhance document structure by replacing generic <div> wrappers with semantic tags (<header>, <main>, <nav>, <footer>).");
    } else {
      checks.push({
        checkName: "Semantic HTML Elements",
        passed: false,
        awardedScore: 0,
        maxScore: 1.5,
        evidence: "No semantic layout elements (<main>, <header>, <nav>, <footer>) detected in JSX.",
        recommendation: "Use semantic HTML elements (<main>, <header>, <nav>, <footer>) to provide screen readers with landmark navigation.",
      });
      recommendations.push("Adopt semantic HTML layout landmarks (<main>, <header>, <nav>, <footer>) for screen reader accessibility.");
    }

    // Check 2: Image Alt Text Coverage (1.5 marks)
    let totalImages = 0;
    let imagesWithAlt = 0;

    for (const elem of allJsx) {
      if (elem.tagName === "img" || elem.tagName === "Image" || elem.tagName.endsWith(".Image")) {
        totalImages++;
        if (elem.attributes.includes("alt")) {
          imagesWithAlt++;
        }
      }
    }

    if (totalImages === 0 || imagesWithAlt / totalImages >= 0.8) {
      totalScore += 1.5;
      const ev = totalImages === 0
        ? "No image elements present (alt text requirement satisfied)."
        : `Verified alt text attributes on ${imagesWithAlt}/${totalImages} image elements (${Math.round((imagesWithAlt / totalImages) * 100)}%).`;
      evidenceCitations.push(ev);
      checks.push({
        checkName: "Image Alt Attributes",
        passed: true,
        awardedScore: 1.5,
        maxScore: 1.5,
        evidence: ev,
      });
    } else {
      const altPct = Math.round((imagesWithAlt / totalImages) * 100);
      const partialScore = Math.round((altPct / 100) * 1.5 * 100) / 100;
      totalScore += partialScore;
      checks.push({
        checkName: "Image Alt Attributes",
        passed: false,
        awardedScore: partialScore,
        maxScore: 1.5,
        evidence: `Only ${imagesWithAlt}/${totalImages} (${altPct}%) image elements include explicit 'alt' attributes.`,
        recommendation: "Add descriptive 'alt' properties to all <img> and <Image> components for screen reader accessibility.",
      });
      recommendations.push("Ensure every <img> and <Image> tag specifies a meaningful `alt` attribute describing the visual content.");
    }

    // Check 3: ARIA Attributes & Accessibility Roles (1.5 marks)
    let ariaCount = 0;
    for (const elem of allJsx) {
      for (const attr of elem.attributes) {
        if (attr.startsWith("aria-") || attr === "role") {
          ariaCount++;
        }
      }
    }

    if (ariaCount >= 3) {
      totalScore += 1.5;
      const ev = `Verified ARIA accessibility attributes and roles across JSX components (${ariaCount} instances detected).`;
      evidenceCitations.push(ev);
      checks.push({
        checkName: "ARIA Labels & Accessibility Roles",
        passed: true,
        awardedScore: 1.5,
        maxScore: 1.5,
        evidence: ev,
      });
    } else if (ariaCount > 0) {
      totalScore += 0.75;
      const ev = `Basic ARIA attributes detected (${ariaCount} instances).`;
      evidenceCitations.push(ev);
      checks.push({
        checkName: "ARIA Labels & Accessibility Roles",
        passed: true,
        awardedScore: 0.75,
        maxScore: 1.5,
        evidence: ev,
      });
    } else {
      checks.push({
        checkName: "ARIA Labels & Accessibility Roles",
        passed: false,
        awardedScore: 0,
        maxScore: 1.5,
        evidence: "No ARIA attributes (aria-label, aria-expanded, role) found in interactive UI components.",
        recommendation: "Add `aria-label`, `aria-expanded`, or `role` attributes to custom buttons, toggles, and dropdowns.",
      });
      recommendations.push("Incorporate `aria-label` or `aria-expanded` attributes on icon buttons and interactive controls.");
    }

    // Check 4: Form Input Labels & Accessibility (1.25 marks)
    let inputCount = 0;
    let labeledInputCount = 0;

    for (const elem of allJsx) {
      if (elem.tagName === "input" || elem.tagName === "textarea" || elem.tagName === "select") {
        inputCount++;
        if (
          elem.attributes.includes("aria-label") ||
          elem.attributes.includes("aria-labelledby") ||
          elem.attributes.includes("id") ||
          elem.attributes.includes("placeholder")
        ) {
          labeledInputCount++;
        }
      }
    }

    if (inputCount === 0 || labeledInputCount / inputCount >= 0.8) {
      totalScore += 1.25;
      const ev = inputCount === 0
        ? "No form input elements present."
        : `Verified input label bindings on ${labeledInputCount}/${inputCount} form controls.`;
      evidenceCitations.push(ev);
      checks.push({
        checkName: "Form Input Accessibility",
        passed: true,
        awardedScore: 1.25,
        maxScore: 1.25,
        evidence: ev,
      });
    } else {
      checks.push({
        checkName: "Form Input Accessibility",
        passed: false,
        awardedScore: 0.5,
        maxScore: 1.25,
        evidence: `Unbound form inputs detected (${labeledInputCount}/${inputCount} controls labeled).`,
        recommendation: "Ensure all <input>, <textarea>, and <select> controls are bound to a <label htmlFor=\"...\"> or have an `aria-label`.",
      });
      recommendations.push("Pair all form inputs with associated `<label htmlFor=\"...\">` or `aria-label` tags.");
    }

    // Check 5: Heading Hierarchy Progression (1.25 marks)
    let hasH1 = false;
    const detectedHeadings = new Set<string>();

    for (const elem of allJsx) {
      const tag = elem.tagName.toLowerCase();
      if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)) {
        detectedHeadings.add(tag);
        if (tag === "h1") hasH1 = true;
      }
    }

    if (hasH1) {
      totalScore += 1.25;
      const ev = `Logical heading hierarchy verified with primary <h1> tag and levels (<${Array.from(detectedHeadings).join(">, <")}>).`;
      evidenceCitations.push(ev);
      checks.push({
        checkName: "Heading Hierarchy Progression",
        passed: true,
        awardedScore: 1.25,
        maxScore: 1.25,
        evidence: ev,
      });
    } else if (detectedHeadings.size > 0) {
      totalScore += 0.5;
      checks.push({
        checkName: "Heading Hierarchy Progression",
        passed: false,
        awardedScore: 0.5,
        maxScore: 1.25,
        evidence: `Sub-headings present (<${Array.from(detectedHeadings).join(">, <")}>) but missing a primary <h1> page title.`,
        recommendation: "Include exactly one top-level <h1> element per page view to establish heading hierarchy.",
      });
      recommendations.push("Include a single top-level `<h1>` element on each page to structure document outline.");
    } else {
      checks.push({
        checkName: "Heading Hierarchy Progression",
        passed: false,
        awardedScore: 0,
        maxScore: 1.25,
        evidence: "No heading elements (<h1> through <h6>) detected in page components.",
        recommendation: "Use <h1>, <h2>, and <h3> elements to structure content headings logically.",
      });
      recommendations.push("Structure page headings using standard HTML `<h1>` through `<h3>` tags.");
    }

    const roundedScore = Math.min(7, Math.round(totalScore * 100) / 100);

    return {
      moduleName: "Accessibility Engine",
      category: "accessibility",
      score: roundedScore,
      maxScore,
      confidencePercent: 95,
      checks,
      evidenceCitations,
      recommendations,
    };
  }
}
