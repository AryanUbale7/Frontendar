import { DEFAULT_ALIAS_DICTIONARY } from "./alias-dictionary";

export class SynonymEngine {
  private dictionary: Record<string, string[]>;

  constructor(customDictionary?: Record<string, string[]>) {
    this.dictionary = { ...DEFAULT_ALIAS_DICTIONARY, ...(customDictionary || {}) };
  }

  public updateDictionary(customDictionary: Record<string, string[]>): void {
    this.dictionary = { ...DEFAULT_ALIAS_DICTIONARY, ...customDictionary };
  }

  public getAliases(term: string): string[] {
    const key = term.toLowerCase().trim();
    const exactGroup = this.dictionary[key];
    if (exactGroup) {
      return Array.from(new Set([key, ...exactGroup]));
    }

    for (const [groupKey, synonyms] of Object.entries(this.dictionary)) {
      if (groupKey === key || synonyms.some((s) => s.toLowerCase() === key)) {
        return Array.from(new Set([groupKey, ...synonyms]));
      }
    }

    return [key];
  }

  public matchesTermOrSynonym(candidateText: string, targetTerm: string): boolean {
    if (!candidateText || !targetTerm) return false;
    const lowerCandidate = candidateText.toLowerCase();
    const aliases = this.getAliases(targetTerm);

    return aliases.some((alias) => lowerCandidate.includes(alias.toLowerCase()));
  }

  public findMatchingTerms(text: string, terms: string[]): string[] {
    if (!text || !terms) return [];
    return terms.filter((term) => this.matchesTermOrSynonym(text, term));
  }
}
