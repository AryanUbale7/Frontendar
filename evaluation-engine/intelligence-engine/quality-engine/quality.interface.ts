export interface ModuleCheckResult {
  checkName: string;
  passed: boolean;
  awardedScore: number;
  maxScore: number;
  evidence: string;
  recommendation?: string;
}

export interface QualityModuleReport {
  moduleName: string;
  category: "performance" | "accessibility" | "responsive" | "code_quality" | "architecture" | "documentation";
  score: number;
  maxScore: number;
  confidencePercent: number;
  checks: ModuleCheckResult[];
  evidenceCitations: string[];
  recommendations: string[];
}

export interface FQEReport {
  totalScore: number; // Max 40
  maxScore: 40;
  performanceScore: number; // Max 7
  accessibilityScore: number; // Max 7
  responsiveScore: number; // Max 7
  codeQualityScore: number; // Max 7
  architectureScore: number; // Max 6
  documentationScore: number; // Max 6
  modules: {
    performance: QualityModuleReport;
    accessibility: QualityModuleReport;
    responsive: QualityModuleReport;
    codeQuality: QualityModuleReport;
    architecture: QualityModuleReport;
    documentation: QualityModuleReport;
  };
  evidenceCitations: string[];
  recommendations: string[];
  confidencePercent: number;
}
