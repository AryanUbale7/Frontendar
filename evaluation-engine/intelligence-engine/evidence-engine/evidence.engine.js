"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvidenceEngine = void 0;
class EvidenceEngine {
    evidenceList = [];
    addEvidence(item) {
        this.evidenceList.push(item);
    }
    getEvidenceByCategory(category) {
        return this.evidenceList.filter((e) => e.category === category);
    }
    getAllEvidence() {
        return this.evidenceList;
    }
    formatCitations() {
        return this.evidenceList.map((item) => {
            let str = `[${item.category}] ${item.description}`;
            if (item.sourcePath)
                str += ` (Source: ${item.sourcePath})`;
            if (item.lineNumbers)
                str += `:${item.lineNumbers}`;
            return str;
        });
    }
    clear() {
        this.evidenceList = [];
    }
}
exports.EvidenceEngine = EvidenceEngine;
