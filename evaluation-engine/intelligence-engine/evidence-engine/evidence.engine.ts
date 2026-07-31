export interface ConcreteEvidenceItem {
  category: "Files" | "Routes" | "Components" | "UI Screen" | "Config" | "Security";
  description: string;
  sourcePath?: string;
  lineNumbers?: string;
  proofSnippet?: string;
}

export class EvidenceEngine {
  private evidenceList: ConcreteEvidenceItem[] = [];

  public addEvidence(item: ConcreteEvidenceItem): void {
    this.evidenceList.push(item);
  }

  public getEvidenceByCategory(category: ConcreteEvidenceItem["category"]): ConcreteEvidenceItem[] {
    return this.evidenceList.filter((e) => e.category === category);
  }

  public getAllEvidence(): ConcreteEvidenceItem[] {
    return this.evidenceList;
  }

  public formatCitations(): string[] {
    return this.evidenceList.map((item) => {
      let str = `[${item.category}] ${item.description}`;
      if (item.sourcePath) str += ` (Source: ${item.sourcePath})`;
      if (item.lineNumbers) str += `:${item.lineNumbers}`;
      return str;
    });
  }

  public clear(): void {
    this.evidenceList = [];
  }
}
