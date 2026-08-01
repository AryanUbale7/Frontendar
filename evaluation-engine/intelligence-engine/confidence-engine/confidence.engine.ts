export interface MultiEvidenceSignals {
  readmeMention: boolean;
  folderStructureMatch: boolean;
  routeMatch: boolean;
  componentMatch: boolean;
  uiDetection: boolean;
  apiRouteMatch: boolean;
  packageDependencyMatch: boolean;
  codeASTMatch: boolean;
  wiringEvidence: boolean;
  protectedRouteMatch: boolean;
  envVarMatch: boolean;
  configMatch: boolean;
}

export interface DetailedConfidenceResult {
  featureName: string;
  subFeatureName?: string;
  confidencePercent: number;
  implementationStatus: "Implemented" | "Partially Implemented" | "Not Implemented";
  weightedScore: number;
  maxScore: number;
  breakdown: Record<string, number>;
  evidenceSourcesCount: number;
  rejectedClaims: string[];
}

export class ConfidenceEngine {
  private thresholdPercent: number;

  constructor(thresholdPercent: number = 70) {
    this.thresholdPercent = thresholdPercent;
  }

  public calculateMultiEvidenceConfidence(
    featureName: string,
    maxWeight: number,
    signals: MultiEvidenceSignals,
    subFeatureName?: string
  ): DetailedConfidenceResult {
    // Weights are normalized to sum to 1.0 (calibrated Phase 4).
    // Components carry the primary structural evidence; routes/API are secondary
    // signals so a well-built static SPA is not penalized for lacking a router.
    // `wiring` rewards features whose blueprint-declared expected components
    // exist on disk (feature-specific evidence; never fires for claim-only repos).
    const weights = {
      readme: 0.06,
      folder: 0.10,
      routes: 0.08,
      components: 0.19,
      ui: 0.16,
      api: 0.06,
      packages: 0.06,
      codeAST: 0.14,
      wiring: 0.05,
      protectedRoutes: 0.03,
      envVars: 0.03,
      config: 0.04,
    };

    const rejectedClaims: string[] = [];
    let evidenceCount = 0;
    let earnedRatio = 0;

    const hasSupportingCode = signals.folderStructureMatch || signals.routeMatch || signals.componentMatch || signals.uiDetection || signals.apiRouteMatch || signals.codeASTMatch;

    if (signals.readmeMention && !hasSupportingCode) {
      rejectedClaims.push(`Rejected README claim: '${featureName}' documentation claim lacks supporting codebase, route, or UI evidence.`);
    }

    const checkSignal = (signal: boolean, weightKey: keyof typeof weights) => {
      if (signal && (weightKey !== "readme" || hasSupportingCode)) {
        earnedRatio += weights[weightKey];
        evidenceCount++;
      }
    };

    checkSignal(signals.readmeMention, "readme");
    checkSignal(signals.folderStructureMatch, "folder");
    checkSignal(signals.routeMatch, "routes");
    checkSignal(signals.componentMatch, "components");
    checkSignal(signals.uiDetection, "ui");
    checkSignal(signals.apiRouteMatch, "api");
    checkSignal(signals.packageDependencyMatch, "packages");
    checkSignal(signals.codeASTMatch, "codeAST");
    checkSignal(signals.wiringEvidence, "wiring");
    checkSignal(signals.protectedRouteMatch, "protectedRoutes");
    checkSignal(signals.envVarMatch, "envVars");
    checkSignal(signals.configMatch, "config");

    const confidencePercent = Math.min(100, Math.round(earnedRatio * 100));

    let implementationStatus: "Implemented" | "Partially Implemented" | "Not Implemented" = "Not Implemented";
    let weightedScore = 0;

    // Award is proportional to confidence (Phase 4 calibration): crossing the
    // threshold marks the feature Implemented but never snaps to full weight,
    // so a 68% feature scores 68% of its weight rather than jumping to 100%.
    if (confidencePercent >= this.thresholdPercent) {
      implementationStatus = "Implemented";
      weightedScore = Math.round(maxWeight * (confidencePercent / 100));
    } else if (confidencePercent >= 40) {
      implementationStatus = "Partially Implemented";
      weightedScore = Math.round(maxWeight * (confidencePercent / 100));
    } else {
      implementationStatus = "Not Implemented";
      weightedScore = 0;
    }

    return {
      featureName,
      subFeatureName,
      confidencePercent,
      implementationStatus,
      weightedScore,
      maxScore: maxWeight,
      breakdown: {
        readmePoints: signals.readmeMention && hasSupportingCode ? 2 : 0,
        uiPoints: signals.uiDetection ? 5 : 0,
        codePoints: signals.codeASTMatch ? 6 : 0,
        routesPoints: signals.routeMatch ? 4 : 0,
        apiPoints: signals.apiRouteMatch ? 3 : 0,
      },
      evidenceSourcesCount: evidenceCount,
      rejectedClaims,
    };
  }
}
