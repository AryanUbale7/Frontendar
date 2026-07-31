"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReasoningEngine = void 0;
class ReasoningEngine {
    generateReasoning(categoryName, scoreAwarded, maxMarks, passingMarks, ruleApplied, reason, confidencePercent, evidenceItems, files = [], routes = [], components = [], screens = []) {
        const citations = evidenceItems.map((e) => {
            let citation = `[${e.category}] ${e.description}`;
            if (e.sourcePath)
                citation += ` -> ${e.sourcePath}`;
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
exports.ReasoningEngine = ReasoningEngine;
