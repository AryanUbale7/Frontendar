import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { EvaluationJob } from "../queues/evaluation.queue";
import { Evaluator } from "../evaluator";
import { AuditableReport } from "../report-generator";

export class EvaluationWorker {
  private evaluator = new Evaluator();

  async processJob(job: EvaluationJob): Promise<AuditableReport> {
    // 1. Create Temporary Workspace Path
    const tempDir = path.join(os.tmpdir(), `fa_eval_${job.jobId}`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
      // Create a dummy repository structure inside temp workspace for deterministic testing
      fs.writeFileSync(path.join(tempDir, "package.json"), JSON.stringify({
        name: "test-workspace-project",
        dependencies: {
          "react": "^18.2.0",
          "next": "^14.0.0"
        },
        devDependencies: {
          "typescript": "^5.0.0"
        }
      }));

      fs.writeFileSync(path.join(tempDir, "eslint.config.mjs"), "export default [];");
      fs.writeFileSync(path.join(tempDir, "README.md"), "# Mock project README\n\n## Installation\nnpm install\n\n## Usage\nnpm run dev");
      
      const srcDir = path.join(tempDir, "src");
      fs.mkdirSync(srcDir, { recursive: true });
      fs.writeFileSync(path.join(srcDir, "index.ts"), "// Main TS file\nconsole.log('hello world');");

      // 2. Run Evaluator pipeline
      const report = await this.evaluator.runPipeline(tempDir, job.repoUrl, job.deploymentUrl);

      // 3. Clean up/Delete Temporary Workspace Path
      this.cleanupWorkspace(tempDir);

      return report;
    } catch (err: any) {
      this.cleanupWorkspace(tempDir);
      throw err;
    }
  }

  private cleanupWorkspace(dirPath: string) {
    if (fs.existsSync(dirPath)) {
      try {
        fs.rmSync(dirPath, { recursive: true, force: true });
      } catch (e) {
        console.error(`Failed to delete temporary path: ${dirPath}`, e);
      }
    }
  }
}
