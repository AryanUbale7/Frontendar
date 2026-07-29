export interface AuditResult {
  score: number;            // Evaluated score
  maxScore: number;         // Maximum possible score
  evidence: string[];       // Verifiable codebase facts
  warnings: string[];       // Non-critical guidelines violations
  errors: string[];         // Critical build/compilation or security errors
  recommendations: string[];// Direct actionable feedback
}

export interface IEvaluationPlugin {
  name: string;
  run(workspacePath: string, deploymentUrl?: string, config?: any): Promise<AuditResult>;
}
