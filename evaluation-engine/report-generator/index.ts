import { AuditResult } from "../plugins/plugin.interface";
import { ScoreSummary } from "../score-engine";

export interface AuditableReport {
  reportId: string;
  timestamp: string;
  workspacePath: string;
  deploymentUrl?: string;
  scores: ScoreSummary;
  details: Record<string, AuditResult>;
  auditableLog: string[];
}

export class ReportGenerator {
  generateReport(
    workspacePath: string,
    results: Record<string, AuditResult>,
    scores: ScoreSummary,
    deploymentUrl?: string
  ): AuditableReport {
    const auditableLog: string[] = [];

    // Compile log messages showing exact citations
    for (const [pluginName, result] of Object.entries(results)) {
      auditableLog.push(`[Audit] ${pluginName} - Score: ${result.score}/${result.maxScore}`);
      result.evidence.forEach(ev => auditableLog.push(`  Evidence: ${ev}`));
      result.warnings.forEach(wr => auditableLog.push(`  Warning: ${wr}`));
      result.errors.forEach(err => auditableLog.push(`  Error: ${err}`));
    }

    return {
      reportId: `rep_auto_${Date.now()}`,
      timestamp: new Date().toISOString(),
      workspacePath,
      deploymentUrl,
      scores,
      details: results,
      auditableLog
    };
  }
}
