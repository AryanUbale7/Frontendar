"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SynonymEngine = void 0;
const alias_dictionary_1 = require("./alias-dictionary");
class SynonymEngine {
    dictionary;
    constructor(customDictionary) {
        this.dictionary = { ...alias_dictionary_1.DEFAULT_ALIAS_DICTIONARY, ...(customDictionary || {}) };
    }
    updateDictionary(customDictionary) {
        this.dictionary = { ...alias_dictionary_1.DEFAULT_ALIAS_DICTIONARY, ...customDictionary };
    }
    getAliases(term) {
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
    matchesTermOrSynonym(candidateText, targetTerm) {
        if (!candidateText || !targetTerm)
            return false;
        const lowerCandidate = candidateText.toLowerCase();
        const aliases = this.getAliases(targetTerm);
        return aliases.some((alias) => lowerCandidate.includes(alias.toLowerCase()));
    }
    findMatchingTerms(text, terms) {
        if (!text || !terms)
            return [];
        return terms.filter((term) => this.matchesTermOrSynonym(text, term));
    }
}
exports.SynonymEngine = SynonymEngine;
