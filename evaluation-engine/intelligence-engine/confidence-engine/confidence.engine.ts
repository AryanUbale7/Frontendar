export interface MultiEvidenceSignals {
  readmeMention: boolean;
  folderStructureMatch: boolean;
  routeMatch: boolean;
  componentMatch: boolean;
  uiDetection: boolean;
  apiRouteMatch: boolean;
  packageDependencyMatch: boolean;
  codeASTMatch: boolean;
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
    const weights = {
      readme: 0.10,
      folder: 0.15,
      routes: 0.20,
      components: 0.15,
      ui: 0.20,
      api: 0.10,
      packages: 0.10,
      codeAST: 0.10,
      protectedRoutes: 0.05,
      envVars: 0.05,
      config: 0.05,
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
    checkSignal(signals.protectedRouteMatch, "protectedRoutes");
    checkSignal(signals.envVarMatch, "envVars");
    checkSignal(signals.configMatch, "config");

    const confidencePercent = Math.min(100, Math.round(earnedRatio * 100));

    let implementationStatus: "Implemented" | "Partially Implemented" | "Not Implemented" = "Not Implemented";
    let weightedScore = 0;

    if (confidencePercent >= this.thresholdPercent) {
      implementationStatus = "Implemented";
      weightedScore = maxWeight;
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
