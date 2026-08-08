export interface ProblemStatement {
  id?: string;
  title: string;
  description: string;
  background?: string;
  objectives?: string;
  expectedSolution?: string;
  idealWorkflow?: string;
  targetAudience?: string;
  difficulty?: "Beginner" | "Intermediate" | "Advanced" | "Expert" | string;
}

export interface SubFeature {
  id?: string;
  name: string;
  description?: string;
  weight: number;
  aliases?: string[];
  expectedRoutes?: string[];
  expectedComponents?: string[];
  expectedAPIs?: string[];
  expectedPackages?: string[];
  expectedUIElements?: string[];
}

export interface ExpectedFeature {
  id?: string;
  problemStatementId?: string;
  name: string;
  description: string;
  mandatory: boolean;
  weight: number;
  keywords?: string[];
  synonyms?: string[];
  subFeatures?: SubFeature[];
  expectedRoutes?: string[];
  expectedComponents?: string[];
  expectedAPIs?: string[];
  expectedPackages?: string[];
  expectedPages?: string[];
  expectedUIElements?: string[];
  expectedNavigation?: string[];
  expectedButtons?: string[];
  expectedForms?: string[];
  expectedDatabaseModels?: string[];
  expectedEnvVars?: string[];
}

export interface ExpectedModule {
  name: string;
  description: string;
  mandatory: boolean;
  weight: number;
}

export interface ExpectedPage {
  path: string;
  title: string;
  mandatory: boolean;
  weight: number;
}

export interface ExpectedRoute {
  pattern: string;
  type: "page" | "api";
  mandatory: boolean;
  weight: number;
}

export interface ExpectedAPI {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  mandatory: boolean;
  weight: number;
}

export interface FolderRule {
  path: string;
  requiredFiles?: string[];
  mandatory: boolean;
  weight: number;
}

export interface ExpectedComponent {
  name: string;
  description?: string;
  mandatory: boolean;
  weight: number;
}

export interface TechStackRules {
  allowed: string[];
  required: string[];
  optional?: string[];
  restricted: string[];
  frameworkRequirements?: string;
  databaseRequirements?: string;
  hostingRequirements?: string;
}

export interface ScoringCategory {
  name: string;
  weight: number;
  maxMarks: number;
  passingMarks: number;
}

export interface MandatoryRule {
  rule: string;
  penalty: number;
  autoFail: boolean;
}

export interface BonusRule {
  name: string;
  condition?: string;
  points: number;
}

export interface PenaltyRule {
  name: string;
  condition: string;
  points: number;
}

export interface KnowledgeBlueprint {
  problemStatement: ProblemStatement;
  problemStatements?: ProblemStatement[];
  selectedProblemIndex?: number;
  objectives?: string[];
  requiredModules?: ExpectedModule[];
  requiredFeatures: ExpectedFeature[];
  expectedPages?: ExpectedPage[];
  expectedRoutes?: ExpectedRoute[];
  expectedAPIs?: ExpectedAPI[];
  expectedFolderStructure?: FolderRule[];
  expectedComponents?: ExpectedComponent[];
  techStackRules: TechStackRules;
  keywords?: string[];
  synonymDictionary?: Record<string, string[]>;
  confidenceThreshold?: number; // Configurable threshold (e.g. 75% for Implemented vs Partially Implemented)
  submissionRequirements?: Record<string, boolean>;
  codeQualityRules?: Record<string, number>;
  performanceRules?: Record<string, any>;
  scoringSystem: {
    categories: ScoringCategory[];
  };
  autoPassFailRules?: Array<{ rule: string; action: "fail" | "deduct"; points?: number }>;
  mandatoryRules?: MandatoryRule[];
  bonusRules?: BonusRule[];
  penaltyRules?: PenaltyRule[];
}
