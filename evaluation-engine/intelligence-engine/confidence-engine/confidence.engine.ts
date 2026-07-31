export interface ConfidenceWeights {
  readmeWeight: number;    // 10%
  folderWeight: number;    // 20%
  routesWeight: number;    // 20%
  uiWeight: number;        // 20%
  apiWeight: number;       // 30%
}

export const DEFAULT_CONFIDENCE_WEIGHTS: ConfidenceWeights = {
  readmeWeight: 10,
  folderWeight: 20,
  routesWeight: 20,
  uiWeight: 20,
  apiWeight: 30,
};

export interface ConfidenceBreakdown {
  featureName: string;
  readmeConfidence: number;
  folderConfidence: number;
  routesConfidence: number;
  uiConfidence: number;
  apiConfidence: number;
  finalConfidencePercent: number;
}

export class ConfidenceEngine {
  private weights: ConfidenceWeights;

  constructor(customWeights?: Partial<ConfidenceWeights>) {
    this.weights = { ...DEFAULT_CONFIDENCE_WEIGHTS, ...(customWeights || {}) };
  }

  public calculateConfidence(
    featureName: string,
    signals: {
      inReadme: boolean;
      inFolder: boolean;
      inRoutes: boolean;
      inUI: boolean;
      inAPI: boolean;
    }
  ): ConfidenceBreakdown {
    const readmeConfidence = signals.inReadme ? this.weights.readmeWeight : 0;
    const folderConfidence = signals.inFolder ? this.weights.folderWeight : 0;
    const routesConfidence = signals.inRoutes ? this.weights.routesWeight : 0;
    const uiConfidence = signals.inUI ? this.weights.uiWeight : 0;
    const apiConfidence = signals.inAPI ? this.weights.apiWeight : 0;

    const totalCalculated =
      readmeConfidence + folderConfidence + routesConfidence + uiConfidence + apiConfidence;

    const maxWeight =
      this.weights.readmeWeight +
      this.weights.folderWeight +
      this.weights.routesWeight +
      this.weights.uiWeight +
      this.weights.apiWeight;

    const finalConfidencePercent = Math.min(100, Math.round((totalCalculated / maxWeight) * 100));

    return {
      featureName,
      readmeConfidence,
      folderConfidence,
      routesConfidence,
      uiConfidence,
      apiConfidence,
      finalConfidencePercent,
    };
  }
}
