import * as fs from "fs";
import * as path from "path";
import { SynonymEngine } from "../synonym-engine/synonym.engine";
import { ExpectedFeature } from "../knowledge-engine/knowledge-blueprint.interface";

export interface FeatureDetectionResult {
  featureId: string;
  featureName: string;
  implemented: boolean;
  confidenceScore: number;
  evidence: {
    readmeMatches: string[];
    fileMatches: string[];
    routeMatches: string[];
    componentMatches: string[];
  };
}

export class FeatureEngine {
  private synonymEngine: SynonymEngine;

  constructor(synonymEngine?: SynonymEngine) {
    this.synonymEngine = synonymEngine || new SynonymEngine();
  }

  public evaluateFeatures(
    workspacePath: string,
    features: ExpectedFeature[],
    detectedFiles: string[],
    detectedRoutes: string[],
    detectedComponents: string[]
  ): FeatureDetectionResult[] {
    const readmeContent = this.readReadmeContent(workspacePath);
    const results: FeatureDetectionResult[] = [];

    for (const feature of features) {
      const readmeMatches: string[] = [];
      const fileMatches: string[] = [];
      const routeMatches: string[] = [];
      const componentMatches: string[] = [];

      const targetTerm = feature.name;

      if (readmeContent && this.synonymEngine.matchesTermOrSynonym(readmeContent, targetTerm)) {
        readmeMatches.push(`README mention: Detected '${targetTerm}' keywords/synonyms in documentation.`);
      }

      for (const file of detectedFiles) {
        const base = path.basename(file);
        if (this.synonymEngine.matchesTermOrSynonym(base, targetTerm)) {
          fileMatches.push(path.relative(workspacePath, file).replace(/\\/g, "/"));
        } else {
          try {
            const fileText = fs.readFileSync(file, "utf-8");
            if (this.synonymEngine.matchesTermOrSynonym(fileText, targetTerm)) {
              fileMatches.push(`${path.relative(workspacePath, file).replace(/\\/g, "/")} (code references)`);
            }
          } catch {}
        }
      }

      for (const route of detectedRoutes) {
        if (this.synonymEngine.matchesTermOrSynonym(route, targetTerm)) {
          routeMatches.push(route);
        }
      }

      for (const comp of detectedComponents) {
        if (this.synonymEngine.matchesTermOrSynonym(comp, targetTerm)) {
          componentMatches.push(comp);
        }
      }

      const totalSignals =
        (readmeMatches.length > 0 ? 1 : 0) +
        (fileMatches.length > 0 ? 2 : 0) +
        (routeMatches.length > 0 ? 2 : 0) +
        (componentMatches.length > 0 ? 2 : 0);

      const implemented = totalSignals >= 1 || feature.mandatory;
      let confidence = Math.min(100, totalSignals * 20 + (implemented ? 40 : 0));

      results.push({
        featureId: feature.id || feature.name,
        featureName: feature.name,
        implemented,
        confidenceScore: confidence,
        evidence: {
          readmeMatches,
          fileMatches: fileMatches.slice(0, 5),
          routeMatches,
          componentMatches,
        },
      });
    }

    return results;
  }

  private readReadmeContent(workspacePath: string): string | null {
    const candidatePaths = [
      path.join(workspacePath, "README.md"),
      path.join(workspacePath, "readme.md"),
      path.join(workspacePath, "README.txt"),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          return fs.readFileSync(p, "utf-8");
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}
