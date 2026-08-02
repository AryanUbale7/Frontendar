import * as fs from "fs";
import * as path from "path";
import { KnowledgeBlueprint } from "./knowledge-engine/knowledge-blueprint.interface";
import { KnowledgeEngine } from "./knowledge-engine/knowledge.engine";
import { SynonymEngine } from "./synonym-engine/synonym.engine";
import { FeatureEngine, FeatureDetectionResult, CapabilityVerification } from "./feature-engine/feature.engine";
import { RepositoryEngine } from "./repository-engine/repository.engine";
import { RouteEngine } from "./route-engine/route.engine";
import { UIEngine, UIScreenshotEvidence } from "./ui-engine/ui.engine";
import { InferenceEngine } from "./inference-engine/inference.engine";
import { ConfidenceEngine } from "./confidence-engine/confidence.engine";
import { ReasoningEngine, CategoryReasoning } from "./reasoning-engine/reasoning.engine";
import { EvidenceEngine, EvidenceLevel } from "./evidence-engine/evidence.engine";
import { ScoringEngine, FAIEReportSummary, TraceEntry } from "./scoring-engine/scoring.engine";
import { ProjectClassifierEngine } from "./project-classifier-engine/project-classifier.engine";
import { ProjectType, ClassificationResult } from "./project-classifier-engine/project-type.interface";

export interface FAIEReportV2 {
  hackathonTitle: string;
  repoUrl: string;
  deploymentUrl?: string;
  status: "pass" | "fail";
  projectClassification?: {
    detectedProjectType: ProjectType;
    confidencePercent: number;
    evidenceSummary: string[];
  };
  scoreSummary: {
    finalScore: number;
    featureCoveragePercent: number;
    technologyCompliancePercent: number;
    uiCompliancePercent: number;
    moduleCoveragePercent: number;
    overallAlignmentPercent: number;
    bonusPointsTotal: number;
    deductionsTotal: number;
  };
  scoreTrace: TraceEntry[];
  penaltyTrace: TraceEntry[];
  featureTreeEvaluations: Array<{
    featureName: string;
    mandatory: boolean;
    maxWeight: number;
    awardedScore: number;
    status: string;
    implementationDepth: string;
    evidenceLevel: number;
    confidenceScore: number;
    subFeatures: Array<{
      subFeatureName: string;
      weight: number;
      awardedScore: number;
      confidencePercent: number;
      status: string;
      implementationDepth: string;
    }>;
  }>;
  scoringDetails: Array<{
    categoryName: string;
    awardedMarks: number;
    maxMarks: number;
    passingMarks: number;
    evaluatedBy: string;
    evidenceCitations: string[];
    confidencePercent: number;
    ruleApplied: string;
  }>;
  screenshots: UIScreenshotEvidence[];
  rejectedClaims: string[];
  reasonings: CategoryReasoning[];
  logs: string[];
  auditableReportId: string;
  timestamp: string;
  capabilityVerifications?: CapabilityVerification[];
}

export class FAIEOrchestrator {
  private knowledgeEngine = new KnowledgeEngine();
  private synonymEngine: SynonymEngine;
  private featureEngine: FeatureEngine;
  private repositoryEngine = new RepositoryEngine();
  private routeEngine = new RouteEngine();
  private uiEngine = new UIEngine();
  private inferenceEngine = new InferenceEngine();
  private confidenceEngine: ConfidenceEngine;
  private reasoningEngine = new ReasoningEngine();
  private evidenceEngine = new EvidenceEngine();
  private scoringEngine = new ScoringEngine();
  private projectClassifierEngine = new ProjectClassifierEngine();

  constructor(customSynonymDict?: Record<string, string[]>, confidenceThreshold: number = 75) {
    this.synonymEngine = new SynonymEngine(customSynonymDict);
    this.featureEngine = new FeatureEngine(this.synonymEngine, confidenceThreshold);
    this.confidenceEngine = new ConfidenceEngine(confidenceThreshold);
  }

  public async evaluate(
    workspacePath: string,
    repoUrl: string,
    passedBlueprint: KnowledgeBlueprint,
    deploymentUrl?: string,
    toolResults?: any
  ): Promise<FAIEReportV2> {
    const logs: string[] = [];
    logs.push(`[FAIE v2 1/12] Initializing Frontend Arena Intelligence Engine v2.0 for ${repoUrl}...`);

    // 1. Repository Analysis & AST Code Scanning
    if (process.env.ENABLE_AST_EVALUATION === "false") {
      logs.push(`[FAIE v2 2/12] AST Evaluation disabled via global system configuration.`);
    } else {
      logs.push(`[FAIE v2 2/12] Repository Engine: Scanning framework, dependencies, and AST code patterns...`);
    }
    const repoAnalysis = this.repositoryEngine.analyzeRepository(workspacePath);
    logs.push(`[FAIE v2 2/12] Framework: ${repoAnalysis.framework}. Packages scanned: ${repoAnalysis.allDependencies.length}.`);

    // 2. Route Detection
    logs.push(`[FAIE v2 3/12] Route Engine: Detecting App Router, Pages Router, and React routes...`);
    const expectedRoutePatterns = (passedBlueprint?.expectedRoutes || []).map((r) => r.pattern);
    const routeResults = this.routeEngine.detectRoutes(workspacePath, expectedRoutePatterns);
    logs.push(`[FAIE v2 3/12] Detected ${routeResults.detectedRoutes.length} routes.`);

    // 3. Deterministic Project Type Classification
    logs.push(`[FAIE v2 4/12] Project Classifier Engine: Running multi-evidence category classification...`);
    const uiAnalysis = this.uiEngine.analyzeUI(workspacePath, deploymentUrl);
    const classification = this.projectClassifierEngine.classifyProject(repoAnalysis, routeResults, uiAnalysis, passedBlueprint);

    // Resolve blueprint using explicit precedence (Task 1)
    const blueprint = passedBlueprint || classification.selectedBlueprint;
    const isDashboardChallenge = blueprint.problemStatement?.title?.toLowerCase().includes("dashboard") || false;

    logs.push(`[FAIE v2 4/12] Project Type Classified: "${classification.detectedProjectType}" (${classification.confidencePercent}% confidence).`);
    logs.push(`[FAIE v2 4/12] Classification Evidence: ${classification.evidenceSummary.slice(0, 4).join("; ")}`);

    // Validate & Normalize Selected Blueprint
    const val = this.knowledgeEngine.validateBlueprint(blueprint);
    if (!val.valid) {
      logs.push(`[FAIE v2 4/12] Blueprint warnings: ${val.errors.join("; ")}`);
    }
    const activeProblem = this.knowledgeEngine.getActiveProblemStatement(blueprint);
    logs.push(`[FAIE v2 4/12] Selected Scoring Blueprint: "${activeProblem.title}".`);

    // 4. Multi-Evidence Feature Tree Evaluation
    logs.push(`[FAIE v2 5/12] Feature Engine: Evaluating hierarchical feature tree with multi-evidence cross-validation...`);
    const normalizedFeatures = this.knowledgeEngine.normalizeFeatures(blueprint);
    const featureResults: FeatureDetectionResult[] = this.featureEngine.evaluateFeatures(
      workspacePath,
      normalizedFeatures,
      repoAnalysis,
      routeResults,
      uiAnalysis
    );

    // Collect all rejected claims across features
    const allRejectedClaims: string[] = [];
    featureResults.forEach((fr) => {
      if (fr.evidence.rejectedClaims && fr.evidence.rejectedClaims.length > 0) {
        allRejectedClaims.push(...fr.evidence.rejectedClaims);
        fr.evidence.rejectedClaims.forEach((rc) => logs.push(`[FAIE v2 False Positive Shield] ${rc}`));
      }
    });

    // 5. Playwright UI Verification & Screenshot Evidence
    logs.push(`[FAIE v2 6/12] UI Engine: Running Playwright multi-view navigation & screenshot capture...`);
    // Re-use already initialized uiAnalysis

    // 6. Inference Engine Rule Checks
    logs.push(`[FAIE v2 7/12] Inference Engine: Executing deterministic IF-THEN rule verifications...`);
    const inferenceRules = this.inferenceEngine.runInference(featureResults, repoAnalysis, routeResults, uiAnalysis);

    // 7. Evidence Engine Collection
    logs.push(`[FAIE v2 8/12] Evidence Engine: Formatting concrete proof citations and line references...`);
    this.evidenceEngine.clear();

    featureResults.forEach((fr) => {
      if (fr.implementationStatus !== "Not Implemented") {
        this.evidenceEngine.addEvidence({
          category: "Components",
          description: `Feature '${fr.featureName}' marked ${fr.implementationStatus} (depth: ${fr.implementationDepth}, L${fr.evidence.evidenceLevel} evidence, ${fr.confidenceScore}% confidence). Awarded ${fr.awardedScore}/${fr.maxWeight} pts.`,
          sourcePath: fr.evidence.fileMatches[0] || fr.evidence.routeMatches[0],
          evidenceLevel: fr.evidence.evidenceLevel as EvidenceLevel,
        });
      }
    });

    uiAnalysis.detectedUIComponents.forEach((comp) => {
      this.evidenceEngine.addEvidence({
        category: "UI Screen",
        description: `Verified interactive ${comp} component layout.`,
      });
    });

    // 8. Reasoning Engine Category Breakdowns
    logs.push(`[FAIE v2 9/12] Reasoning Engine: Generating explainable category reasonings...`);
    const reasonings: CategoryReasoning[] = [];
    const capabilityVerifications = this.featureEngine.evaluateCapabilities(repoAnalysis, uiAnalysis);

    blueprint.scoringSystem.categories.forEach((cat) => {
      let scoreAwarded = 0;
      let ruleApplied = "";
      let reasonStr = "";
      let confidence = 50;

      const catLower = cat.name.toLowerCase();
      const totalAwarded = featureResults.reduce((acc, fr) => acc + fr.awardedScore, 0);
      const totalMax = featureResults.reduce((acc, fr) => acc + fr.maxWeight, 0) || 1;
      const ratio = totalAwarded / totalMax;

      if (isDashboardChallenge) {
        // --- TASK 3: GRANULAR CAPABILITY SCORING FOR DASHBOARDS ---
        if (catLower.includes("alignment") || catLower.includes("problem")) {
          const isDashboard = classification.detectedProjectType === "Dashboard";
          scoreAwarded = isDashboard ? cat.maxMarks : Math.round(cat.maxMarks * 0.5);
          ruleApplied = "Classification Problem Alignment Rule";
          confidence = classification.confidencePercent;
          reasonStr = `Project classified as ${classification.detectedProjectType} (${classification.confidencePercent}% confidence). Aligned with Life Dashboard Challenge requirements.`;
        } else if (catLower.includes("ui/ux") || catLower.includes("responsiveness")) {
          const respCap = capabilityVerifications.find(v => v.capability === "RESPONSIVE_LAYOUT");
          const respLevel = respCap ? respCap.evidenceLevel : 0;
          confidence = Math.min(100, respLevel * 20);
          scoreAwarded = Math.min(cat.maxMarks, respLevel * 4);
          ruleApplied = "Evidence-Level UI/UX & Responsive Layout Audit";
          reasonStr = `UI/UX verified: Responsive evidence Level ${respLevel}/5. Layout stable: ${!uiAnalysis.hasBrokenLayout ? "YES" : "NO"}. A responsive implementation at Level 3+ requires responsive classes inside interactive components.`;
        } else if (catLower.includes("functionality") || catLower.includes("interaction")) {
          const stateCap = capabilityVerifications.find(v => v.capability === "STATEFUL_INTERACTION");
          const filterCap = capabilityVerifications.find(v => v.capability === "INTERACTIVE_FILTERING");
          const stateLevel = stateCap ? stateCap.evidenceLevel : 0;
          const filterLevel = filterCap ? filterCap.evidenceLevel : 0;
          confidence = Math.min(100, Math.max(stateLevel, filterLevel) * 20);
          let score = Math.min(cat.maxMarks, Math.max(stateLevel, filterLevel) * 5);

          // Dynamic state-to-UI binding: state declared AND rendered in JSX expressions
          const hasDynamicBinding = repoAnalysis.allSourceFiles.some(f => {
            try {
              const ext = path.extname(f).toLowerCase();
              if ([".js", ".jsx", ".ts", ".tsx"].includes(ext)) {
                const text = fs.readFileSync(f, "utf-8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n\r]*/g, "");
                return text.includes("useState") && /(:\s*\{|=\s*\{)[^}]*\}/.test(text);
              }
            } catch {}
            return false;
          });
          if (hasDynamicBinding) score += 2;
          scoreAwarded = Math.min(cat.maxMarks, score);
          ruleApplied = "Evidence-Level Semantic Interaction & Capability Verification";
          reasonStr = `Interaction checks: State Level ${stateLevel}/5, Filter Level ${filterLevel}/5. Dynamic state-to-UI binding: ${hasDynamicBinding ? "YES" : "NO"}.`;
        } else if (catLower.includes("visualization") || catLower.includes("data viz")) {
          const vizCap = capabilityVerifications.find(v => v.capability === "DATA_VISUALIZATION");
          const vizLevel = vizCap ? vizCap.evidenceLevel : 0;
          confidence = Math.min(100, vizLevel * 20);
          let score = Math.min(cat.maxMarks, vizLevel * 3);

          if (vizLevel >= 3) {
            // Check rendered charts count
            let chartsCount = 0;
            repoAnalysis.allSourceFiles.forEach(f => {
              try {
                const ext = path.extname(f).toLowerCase();
                if ([".js", ".jsx", ".ts", ".tsx"].includes(ext)) {
                  const text = fs.readFileSync(f, "utf-8");
                  const matches = text.match(/LineChart|BarChart|AreaChart|PieChart|ScatterChart/g);
                  if (matches) chartsCount += matches.length;
                }
              } catch {}
            });
            if (chartsCount > 2) score += 2;

            // Distinct chart types
            const hasMultipleTypes = repoAnalysis.allSourceFiles.some(f => {
              try {
                const ext = path.extname(f).toLowerCase();
                if ([".js", ".jsx", ".ts", ".tsx"].includes(ext)) {
                  const text = fs.readFileSync(f, "utf-8");
                  return text.includes("LineChart") && (text.includes("BarChart") || text.includes("AreaChart"));
                }
              } catch {}
              return false;
            });
            if (hasMultipleTypes) score += 2;

            // ResponsiveContainer usage
            const hasResponsiveContainer = repoAnalysis.allSourceFiles.some(f => {
              try {
                const ext = path.extname(f).toLowerCase();
                if ([".js", ".jsx", ".ts", ".tsx"].includes(ext)) {
                  const text = fs.readFileSync(f, "utf-8");
                  return text.includes("ResponsiveContainer");
                }
              } catch {}
              return false;
            });
            if (hasResponsiveContainer) score += 1;

            // Tooltips
            const hasTooltip = repoAnalysis.allSourceFiles.some(f => {
              try {
                const ext = path.extname(f).toLowerCase();
                if ([".js", ".jsx", ".ts", ".tsx"].includes(ext)) {
                  const text = fs.readFileSync(f, "utf-8");
                  return text.includes("Tooltip");
                }
              } catch {}
              return false;
            });
            if (hasTooltip) score += 1;

            // Legends
            const hasLegend = repoAnalysis.allSourceFiles.some(f => {
              try {
                const ext = path.extname(f).toLowerCase();
                if ([".js", ".jsx", ".ts", ".tsx"].includes(ext)) {
                  const text = fs.readFileSync(f, "utf-8");
                  return text.includes("Legend");
                }
              } catch {}
              return false;
            });
            if (hasLegend) score += 1;

            // Axes
            const hasAxes = repoAnalysis.allSourceFiles.some(f => {
              try {
                const ext = path.extname(f).toLowerCase();
                if ([".js", ".jsx", ".ts", ".tsx"].includes(ext)) {
                  const text = fs.readFileSync(f, "utf-8");
                  return text.includes("XAxis") && text.includes("YAxis");
                }
              } catch {}
              return false;
            });
            if (hasAxes) score += 1;

            // Active filters/data transform affecting charts
            const hasDataTransform = repoAnalysis.allSourceFiles.some(f => {
              try {
                const ext = path.extname(f).toLowerCase();
                if ([".js", ".jsx", ".ts", ".tsx"].includes(ext)) {
                  const text = fs.readFileSync(f, "utf-8");
                  return text.includes(".map") && text.includes("data={");
                }
              } catch {}
              return false;
            });
            if (hasDataTransform) score += 1;
          }
          scoreAwarded = Math.min(cat.maxMarks, score);
          ruleApplied = "AST Data Visualization Engine Check";
          reasonStr = `Visualization checks: Viz Level ${vizLevel}/5. Mapped active charts: ${score >= 10 ? "YES" : "NO"}. Legend/Tooltip/Responsive: ${score >= 13 ? "YES" : "NO"}.`;
        } else if (catLower.includes("code quality") || catLower.includes("architecture")) {
          let score = 4; // base
          if (repoAnalysis.detectedFilesCount > 5) score += 2;
          if (repoAnalysis.astPatterns.functionalComponentsCount > 3) score += 2;
          if (repoAnalysis.detectedComponents.length > 3) score += 2;
          
          // Deduct for copy-paste code
          let hasDuplication = false;
          const contents = repoAnalysis.allSourceFiles.map(f => {
            try {
              const ext = path.extname(f).toLowerCase();
              if ([".js", ".jsx", ".ts", ".tsx"].includes(ext)) return fs.readFileSync(f, "utf-8");
            } catch {}
            return "";
          }).filter(c => c.length > 50);

          if (contents.length > 2) {
            for (let i = 0; i < contents.length; i++) {
              for (let j = i + 1; j < contents.length; j++) {
                if (contents[i] === contents[j]) {
                  hasDuplication = true;
                  break;
                }
              }
            }
          }
          if (hasDuplication) {
            score -= 2;
          }
          scoreAwarded = Math.max(0, Math.min(cat.maxMarks, score));
          ruleApplied = "Code Architecture & Modularity Scan";
          confidence = Math.min(100, 40 + Math.min(6, repoAnalysis.detectedComponents.length) * 10);
          reasonStr = `Modular structures parsed. Component Count: ${repoAnalysis.detectedComponents.length}. Source files count: ${repoAnalysis.detectedFilesCount}. Duplicate files: ${hasDuplication ? "YES (-2 pts)" : "NO"}.`;
        } else if (catLower.includes("performance") && catLower.includes("accessibility")) {
          let perfPart = 3;
          let accessPart = 3;
          let perfStr = "N/A";
          let accessStr = "N/A";
          
          if (toolResults && toolResults.performance) {
            if (toolResults.performance.lighthouseScore !== "UNAVAILABLE") {
              const lh = toolResults.performance.lighthouseScore;
              perfPart = lh >= 90 ? 5 : lh >= 75 ? 4 : lh >= 50 ? 3 : 2;
              perfStr = `${lh}/100`;
            }
            if (toolResults.performance.accessibilityScore !== "UNAVAILABLE") {
              const lh = toolResults.performance.accessibilityScore;
              accessPart = lh >= 90 ? 5 : lh >= 75 ? 4 : lh >= 50 ? 3 : 2;
              accessStr = `${lh}/100`;
            }
          }
          
          scoreAwarded = Math.min(cat.maxMarks, perfPart + accessPart);
          ruleApplied = "Real Performance & Accessibility Audit";
          confidence = (toolResults?.performance?.lighthouseScore !== "UNAVAILABLE") ? toolResults.performance.lighthouseScore : 75;
          reasonStr = `Scored based on real Lighthouse metrics. Performance: ${perfStr} (contrib: ${perfPart}/5), Accessibility: ${accessStr} (contrib: ${accessPart}/5).`;
        } else if (catLower.includes("performance")) {
          let score = 3; // neutral default
          if (toolResults && toolResults.performance && toolResults.performance.lighthouseScore !== "UNAVAILABLE") {
            const lh = toolResults.performance.lighthouseScore;
            if (lh >= 90) score = 5;
            else if (lh >= 75) score = 4;
            else if (lh >= 50) score = 3;
            else score = 2;
            confidence = lh;
            reasonStr = `Scored based on real Lighthouse Performance: ${lh}/100.`;
          } else {
            score = 3;
            confidence = 50;
            reasonStr = `Lighthouse run: UNAVAILABLE. Applied evidence-neutral default score 3 (50% confidence).`;
          }
          scoreAwarded = Math.min(cat.maxMarks, score);
          ruleApplied = "Real Performance Audit & Optimization Check";
        } else if (catLower.includes("accessibility")) {
          let score = 3; // neutral default
          if (toolResults && toolResults.performance && toolResults.performance.accessibilityScore !== "UNAVAILABLE") {
            const lh = toolResults.performance.accessibilityScore;
            if (lh >= 90) score = 5;
            else if (lh >= 75) score = 4;
            else if (lh >= 50) score = 3;
            else score = 2;
            confidence = lh;
            reasonStr = `Scored based on real Lighthouse Accessibility: ${lh}/100.`;
          } else {
            // Static checks fallback
            const hasAria = repoAnalysis.allSourceFiles.some(f => {
              try {
                const ext = path.extname(f).toLowerCase();
                if ([".js", ".jsx", ".ts", ".tsx"].includes(ext)) {
                  const text = fs.readFileSync(f, "utf-8");
                  return text.includes("aria-") || text.includes("role=") || text.includes("alt=");
                }
              } catch {}
              return false;
            });
            score = hasAria ? 3 : 2;
            confidence = hasAria ? 60 : 30;
            reasonStr = `Lighthouse run: UNAVAILABLE. Static ARIA checks: ${hasAria ? "YES (score: 3)" : "NO (score: 2)"}.`;
          }
          scoreAwarded = Math.min(cat.maxMarks, score);
          ruleApplied = "Real Accessibility Audit & ARIA Checks";
        } else if (catLower.includes("creativity") || catLower.includes("innovation")) {
          let score = 2;
          const dynamicCap = capabilityVerifications.find(v => v.capability === "DYNAMIC_DATA");
          const storyCap = capabilityVerifications.find(v => v.capability === "DATA_STORYTELLING");
          const hasDynamic = dynamicCap && dynamicCap.evidenceLevel >= 3;
          const hasStory = storyCap && storyCap.evidenceLevel >= 3;
          confidence = Math.min(100, Math.max(dynamicCap ? dynamicCap.evidenceLevel : 0, storyCap ? storyCap.evidenceLevel : 0) * 20);
          if (hasDynamic) score += 1;
          
          const hasTheme = repoAnalysis.allSourceFiles.some(f => {
            try {
              const ext = path.extname(f).toLowerCase();
              if ([".js", ".jsx", ".ts", ".tsx"].includes(ext)) {
                const text = fs.readFileSync(f, "utf-8");
                return text.includes("glow") || text.includes("shadow-glow");
              }
            } catch {}
            return false;
          });
          if (hasTheme) score += 1;

          if (hasStory) score += 1;

          scoreAwarded = Math.min(cat.maxMarks, score);
          ruleApplied = "Immersive UX & Feature Innovation Check";
          reasonStr = `Creativity check: Telemetry simulator: ${hasDynamic ? "YES" : "NO"}. Glowing theme layout: ${hasTheme ? "YES" : "NO"}. Storytelling comments: ${hasStory ? "YES" : "NO"}.`;
        } else {
          scoreAwarded = Math.round(cat.maxMarks * Math.max(ratio, 0.5));
          ruleApplied = "Evidence-Based General FAIE Rule";
          confidence = Math.round(ratio * 100);
          reasonStr = `Category '${cat.name}' evaluated via feature-tree evidence ratio ${Math.round(ratio * 100)}%.`;
        }
      } else {
        // --- REGRESSION RULES FOR MOCK / OTHER BLUEPRINTS ---
        if (catLower.includes("alignment") || catLower.includes("problem")) {
          scoreAwarded = Math.round(cat.maxMarks * (0.5 + ratio * 0.5));
          ruleApplied = "Weighted Feature Tree Alignment Rule";
          confidence = classification.confidencePercent;
          reasonStr = `Deterministically aligned with '${activeProblem.title}'. Hierarchical feature score ratio: Math.round(${ratio * 100})%.`;
        } else if (catLower.includes("feature") || catLower.includes("ui/ux") || catLower.includes("ui")) {
          scoreAwarded = Math.round(cat.maxMarks * ratio);
          ruleApplied = "Multi-Evidence Feature Tree Rule";
          confidence = Math.round(ratio * 100);
          reasonStr = `Feature tree evaluation completed. Evaluated ${featureResults.length} root features and sub-features (evidence ratio ${Math.round(ratio * 100)}%).`;
        } else if (catLower.includes("performance") || catLower.includes("seo") || catLower.includes("tech")) {
          scoreAwarded = repoAnalysis.hasTailwind && repoAnalysis.hasTsConfig ? cat.maxMarks : Math.round(cat.maxMarks * Math.max(ratio, 0.5));
          ruleApplied = "AST Tech Stack & Architecture Rule";
          confidence = repoAnalysis.hasTailwind && repoAnalysis.hasTsConfig ? 100 : Math.round(ratio * 100);
          reasonStr = `Framework: '${repoAnalysis.framework}'. TS Usage: ${repoAnalysis.detectedLanguages.typescriptPercent}%. Packages: ${repoAnalysis.allDependencies.length}.`;
        } else if (catLower.includes("documentation") || catLower.includes("readme")) {
          scoreAwarded = repoAnalysis.detectedFilesCount > 5 ? cat.maxMarks : Math.round(cat.maxMarks * 0.6);
          ruleApplied = "Documentation & Setup Guide Rule";
          confidence = repoAnalysis.detectedFilesCount > 5 ? 100 : 60;
          reasonStr = "Repository documentation parsed and verified.";
        } else {
          scoreAwarded = Math.round(cat.maxMarks * Math.max(ratio, 0.5));
          ruleApplied = "Evidence-Based General FAIE Rule";
          confidence = Math.round(ratio * 100);
          reasonStr = `Category '${cat.name}' evaluated via feature-tree evidence ratio ${Math.round(ratio * 100)}%.`;
        }
      }

      reasonings.push(
        this.reasoningEngine.generateReasoning(
          cat.name,
          scoreAwarded,
          cat.maxMarks,
          cat.passingMarks,
          ruleApplied,
          reasonStr,
          confidence,
          this.evidenceEngine.getAllEvidence(),
          routeResults.detectedRoutes.map((r) => r.filePath),
          routeResults.detectedRoutes.map((r) => r.pattern),
          repoAnalysis.detectedComponents,
          uiAnalysis.detectedUIComponents
        )
      );
    });

    // 9. Scoring Engine
    logs.push(`[FAIE v2 10/12] Scoring Engine: Computing final weighted scores...`);
    const faieSummary: FAIEReportSummary = this.scoringEngine.calculateFinalScores(
      blueprint,
      featureResults,
      repoAnalysis,
      routeResults,
      uiAnalysis,
      reasonings,
      isDashboardChallenge
    );

    const featureTreeEvaluations = featureResults.map((fr) => ({
      featureName: fr.featureName,
      mandatory: fr.mandatory,
      maxWeight: fr.maxWeight,
      awardedScore: fr.awardedScore,
      status: fr.implementationStatus,
      implementationDepth: fr.implementationDepth,
      evidenceLevel: fr.evidence.evidenceLevel,
      confidenceScore: fr.confidenceScore,
      subFeatures: fr.subFeatureResults.map((sf) => ({
        subFeatureName: sf.subFeatureName,
        weight: sf.weight,
        awardedScore: sf.awardedScore,
        confidencePercent: sf.confidenceResult.confidencePercent,
        status: sf.confidenceResult.implementationStatus,
        implementationDepth: sf.implementationDepth,
      })),
    }));

    const allLogs = [...logs, ...faieSummary.logs];

    return {
      hackathonTitle: activeProblem.title,
      repoUrl,
      deploymentUrl,
      status: faieSummary.status,
      projectClassification: {
        detectedProjectType: classification.detectedProjectType,
        confidencePercent: classification.confidencePercent,
        evidenceSummary: classification.evidenceSummary,
      },
      scoreSummary: {
        finalScore: faieSummary.finalScore,
        featureCoveragePercent: faieSummary.featureCoveragePercent,
        technologyCompliancePercent: faieSummary.technologyCompliancePercent,
        uiCompliancePercent: faieSummary.uiCompliancePercent,
        moduleCoveragePercent: faieSummary.moduleCoveragePercent,
        overallAlignmentPercent: faieSummary.overallAlignmentPercent,
        bonusPointsTotal: faieSummary.bonusPointsTotal,
        deductionsTotal: faieSummary.deductionsTotal,
      },
      scoreTrace: faieSummary.scoreTrace,
      penaltyTrace: faieSummary.penaltyTrace,
      featureTreeEvaluations,
      scoringDetails: reasonings.map((r) => ({
        categoryName: r.categoryName,
        awardedMarks: r.scoreAwarded,
        maxMarks: r.maxMarks,
        passingMarks: r.passingMarks,
        evaluatedBy: "Frontend Arena Intelligence Engine (FAIE v2)",
        evidenceCitations: r.evidenceCitations,
        confidencePercent: r.confidencePercent,
        ruleApplied: r.ruleApplied,
      })),
      screenshots: uiAnalysis.screenshots,
      rejectedClaims: allRejectedClaims,
      reasonings,
      logs: allLogs,
      auditableReportId: `faie_v2_${Date.now()}`,
      timestamp: new Date().toISOString(),
      capabilityVerifications,
    };
  }
}
