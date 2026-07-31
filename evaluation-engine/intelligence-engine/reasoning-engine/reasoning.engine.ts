import { ConcreteEvidenceItem } from "../evidence-engine/evidence.engine";

export interface CategoryReasoning {
  categoryName: string;
  scoreAwarded: number;
  maxMarks: number;
  passingMarks: number;
  ruleApplied: string;
  reason: string;
  confidencePercent: number;
  detectedFiles: string[];
  detectedRoutes: string[];
  detectedComponents: string[];
  detectedScreens: string[];
  evidenceCitations: string[];
}

export class ReasoningEngine {
  public generateReasoning(
    categoryName: string,
    scoreAwarded: number,
    maxMarks: number,
    passingMarks: number,
    ruleApplied: string,
    reason: string,
    confidencePercent: number,
    evidenceItems: ConcreteEvidenceItem[],
    files: string[] = [],
    routes: string[] = [],
    components: string[] = [],
    screens: string[] = []
  ): CategoryReasoning {
    const citations = evidenceItems.map((e) => {
      let citation = `[${e.category}] ${e.description}`;
      if (e.sourcePath) citation += ` -> ${e.sourcePath}`;
      return citation;
    });

    return {
      categoryName,
      scoreAwarded,
      maxMarks,
      passingMarks,
      ruleApplied,
      reason,
      confidencePercent,
      detectedFiles: files.slice(0, 10),
      detectedRoutes: routes.slice(0, 10),
      detectedComponents: components.slice(0, 10),
      detectedScreens: screens.slice(0, 10),
      evidenceCitations: citations.length > 0 ? citations : [reason],
    };
  }
}
