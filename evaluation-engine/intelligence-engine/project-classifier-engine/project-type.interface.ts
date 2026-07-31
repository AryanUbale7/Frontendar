import { KnowledgeBlueprint } from "../knowledge-engine/knowledge-blueprint.interface";

export type ProjectType =
  | "Portfolio"
  | "Developer Portfolio"
  | "Landing Page"
  | "Dashboard"
  | "Admin Panel"
  | "Todo App"
  | "Blog"
  | "E-Commerce"
  | "SaaS"
  | "CRM"
  | "Hospital"
  | "Education"
  | "Chat App"
  | "Finance"
  | "Analytics"
  | "Documentation Site"
  | "Clone Project"
  | "General Web App";

export interface ClassificationEvidence {
  matchedRoutes: string[];
  matchedComponents: string[];
  matchedPackages: string[];
  matchedModels: string[];
  readmeKeywords: string[];
  score: number;
}

export interface ClassificationResult {
  detectedProjectType: ProjectType;
  confidencePercent: number;
  evidenceSummary: string[];
  categoryScores: Record<string, number>;
  selectedBlueprint: KnowledgeBlueprint;
}
