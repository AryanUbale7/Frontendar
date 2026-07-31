"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureEngine = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const synonym_engine_1 = require("../synonym-engine/synonym.engine");
const confidence_engine_1 = require("../confidence-engine/confidence.engine");
class FeatureEngine {
    synonymEngine;
    confidenceEngine;
    constructor(synonymEngine, confidenceThreshold = 75) {
        this.synonymEngine = synonymEngine || new synonym_engine_1.SynonymEngine();
        this.confidenceEngine = new confidence_engine_1.ConfidenceEngine(confidenceThreshold);
    }
    evaluateFeatures(workspacePath, features, repoAnalysis, routeResults, uiAnalysis) {
        const readmeContent = this.readReadmeContent(workspacePath);
        const results = [];
        const detectedFiles = routeResults.detectedRoutes.map((r) => r.filePath);
        for (const feature of features) {
            const parentName = feature.name;
            const subFeatureResults = [];
            // Evaluate sub-features if present
            if (feature.subFeatures && feature.subFeatures.length > 0) {
                for (const sub of feature.subFeatures) {
                    const subRes = this.evaluateSingleFeatureOrSub(workspacePath, sub.name, sub.weight, readmeContent, repoAnalysis, routeResults, uiAnalysis, detectedFiles, sub.expectedRoutes, sub.expectedComponents, sub.expectedAPIs, sub.expectedPackages, sub.expectedUIElements, parentName);
                    subFeatureResults.push({
                        subFeatureId: sub.id || sub.name,
                        subFeatureName: sub.name,
                        weight: sub.weight,
                        awardedScore: subRes.confidenceResult.weightedScore,
                        confidenceResult: subRes.confidenceResult,
                    });
                }
            }
            // Evaluate parent feature
            const parentRes = this.evaluateSingleFeatureOrSub(workspacePath, parentName, feature.weight, readmeContent, repoAnalysis, routeResults, uiAnalysis, detectedFiles, feature.expectedRoutes, feature.expectedComponents, feature.expectedAPIs, feature.expectedPackages, feature.expectedUIElements);
            let finalAwardedScore = parentRes.confidenceResult.weightedScore;
            let finalConfidence = parentRes.confidenceResult.confidencePercent;
            let finalStatus = parentRes.confidenceResult.implementationStatus;
            // If sub-features exist, sum sub-feature scores for fairer, fine-grained scoring
            if (subFeatureResults.length > 0) {
                const subAwardedSum = subFeatureResults.reduce((acc, sf) => acc + sf.awardedScore, 0);
                const subMaxSum = subFeatureResults.reduce((acc, sf) => acc + sf.weight, 0);
                finalAwardedScore = subMaxSum > 0 ? Math.min(feature.weight, subAwardedSum) : finalAwardedScore;
                finalConfidence = Math.round((finalAwardedScore / feature.weight) * 100);
                if (finalConfidence >= 75)
                    finalStatus = "Implemented";
                else if (finalConfidence >= 40)
                    finalStatus = "Partially Implemented";
                else
                    finalStatus = "Not Implemented";
            }
            results.push({
                featureId: feature.id || feature.name,
                featureName: feature.name,
                mandatory: feature.mandatory,
                maxWeight: feature.weight,
                awardedScore: finalAwardedScore,
                implementationStatus: finalStatus,
                confidenceScore: finalConfidence,
                subFeatureResults,
                evidence: parentRes.evidence,
            });
        }
        return results;
    }
    evaluateSingleFeatureOrSub(workspacePath, name, weight, readmeContent, repoAnalysis, routeResults, uiAnalysis, detectedFiles, expRoutes, expComponents, expAPIs, expPackages, expUIElements, parentFeatureName) {
        const readmeMatches = [];
        const fileMatches = [];
        const routeMatches = [];
        const componentMatches = [];
        const uiMatches = [];
        const packageMatches = [];
        // 1. Readme
        const inReadme = !!(readmeContent && this.synonymEngine.matchesTermOrSynonym(readmeContent, name));
        if (inReadme)
            readmeMatches.push(`README mentions '${name}'`);
        // 2. Routes
        const inRoutes = routeResults.detectedRoutes.some((r) => this.synonymEngine.matchesTermOrSynonym(r.pattern, name));
        if (inRoutes)
            routeMatches.push(`Route detected matching '${name}'`);
        // 3. Components
        const inComponents = repoAnalysis.detectedComponents.some((c) => this.synonymEngine.matchesTermOrSynonym(c, name));
        if (inComponents)
            componentMatches.push(`Component detected matching '${name}'`);
        // 4. UI Elements
        const inUI = uiAnalysis.detectedUIComponents.some((uiComp) => this.synonymEngine.matchesTermOrSynonym(uiComp, name));
        if (inUI)
            uiMatches.push(`UI element detected matching '${name}'`);
        // 5. Packages
        const inPackages = repoAnalysis.allDependencies.some((pkg) => this.synonymEngine.matchesTermOrSynonym(pkg, name));
        if (inPackages)
            packageMatches.push(`Package dependency matching '${name}'`);
        // 6. AST & Folder Structure
        const inFolder = detectedFiles.some((f) => this.synonymEngine.matchesTermOrSynonym(path.basename(f), name));
        const inAPI = routeResults.detectedRoutes.some((r) => r.type === "api" && this.synonymEngine.matchesTermOrSynonym(r.pattern, name));
        const inAST = repoAnalysis.astPatterns.detectedHooks.some((h) => this.synonymEngine.matchesTermOrSynonym(h, name)) ||
            repoAnalysis.astPatterns.detectedForms.some((fm) => this.synonymEngine.matchesTermOrSynonym(fm, name));
        const inProtected = routeResults.detectedRoutes.some((r) => r.pattern.includes("dashboard") || r.pattern.includes("admin"));
        const signals = {
            readmeMention: inReadme,
            folderStructureMatch: inFolder,
            routeMatch: inRoutes,
            componentMatch: inComponents,
            uiDetection: inUI,
            apiRouteMatch: inAPI,
            packageDependencyMatch: inPackages,
            codeASTMatch: inAST,
            protectedRouteMatch: inProtected,
            envVarMatch: true,
            configMatch: repoAnalysis.hasTailwind || repoAnalysis.hasTsConfig,
        };
        const confidenceResult = this.confidenceEngine.calculateMultiEvidenceConfidence(name, weight, signals, parentFeatureName);
        return {
            confidenceResult,
            evidence: {
                readmeMatches,
                fileMatches: fileMatches.slice(0, 5),
                routeMatches,
                componentMatches,
                uiMatches,
                packageMatches,
                rejectedClaims: confidenceResult.rejectedClaims,
            },
        };
    }
    readReadmeContent(workspacePath) {
        const candidatePaths = [
            path.join(workspacePath, "README.md"),
            path.join(workspacePath, "readme.md"),
            path.join(workspacePath, "README.txt"),
        ];
        for (const p of candidatePaths) {
            if (fs.existsSync(p)) {
                try {
                    return fs.readFileSync(p, "utf-8");
                }
                catch {
                    return null;
                }
            }
        }
        return null;
    }
}
exports.FeatureEngine = FeatureEngine;
