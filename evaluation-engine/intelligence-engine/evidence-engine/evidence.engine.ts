export type EvidenceLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const EVIDENCE_LEVEL_LABELS: Record<EvidenceLevel, string> = {
  0: "No Evidence",
  1: "Filename/Keyword Match",
  2: "Structural Presence",
  3: "Data-Flow Verified",
  4: "Rendered Evidence",
  5: "Runtime Verified",
};

export interface ConcreteEvidenceItem {
  category: "Files" | "Routes" | "Components" | "UI Screen" | "Config" | "Security";
  description: string;
  sourcePath?: string;
  lineNumbers?: string;
  proofSnippet?: string;
  evidenceLevel?: EvidenceLevel;
}

export class EvidenceEngine {
  private evidenceList: ConcreteEvidenceItem[] = [];

  public addEvidence(item: ConcreteEvidenceItem): void {
    const dup = this.evidenceList.some(
      (e) =>
        e.category === item.category &&
        e.description === item.description &&
        e.sourcePath === item.sourcePath
    );
    if (dup) return;
    this.evidenceList.push(item);
  }

  public getEvidenceByCategory(category: ConcreteEvidenceItem["category"]): ConcreteEvidenceItem[] {
    return this.evidenceList.filter((e) => e.category === category);
  }

  public getEvidenceByLevel(minLevel: EvidenceLevel): ConcreteEvidenceItem[] {
    return this.evidenceList.filter((e) => (e.evidenceLevel ?? 0) >= minLevel);
  }

  public getMaxEvidenceLevel(): EvidenceLevel {
    let max: EvidenceLevel = 0;
    this.evidenceList.forEach((e) => {
      const lvl = e.evidenceLevel ?? 0;
      if (lvl > max) max = lvl as EvidenceLevel;
    });
    return max;
  }

  public getAllEvidence(): ConcreteEvidenceItem[] {
    return this.evidenceList;
  }

  public formatCitations(): string[] {
    return this.evidenceList.map((item) => {
      let str = `[${item.category}] ${item.description}`;
      if (item.evidenceLevel !== undefined && item.evidenceLevel > 0) {
        str += ` [L${item.evidenceLevel}: ${EVIDENCE_LEVEL_LABELS[item.evidenceLevel]}]`;
      }
      if (item.sourcePath) str += ` (Source: ${item.sourcePath})`;
      if (item.lineNumbers) str += `:${item.lineNumbers}`;
      return str;
    });
  }

  public clear(): void {
    this.evidenceList = [];
  }
}
