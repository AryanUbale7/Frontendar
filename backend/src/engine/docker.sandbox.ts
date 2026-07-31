import { execSync, exec, ExecOptions } from "child_process";
import * as path from "path";

export interface SandboxExecutionOptions {
  workspacePath: string;
  command: string;
  timeoutMs?: number;
  image?: string;
  memoryLimit?: string;
  cpuLimit?: string;
  networkEnabled?: boolean;
}

export interface SandboxExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  usedDockerContainer: boolean;
  commandExecuted: string;
  error?: string;
}

export class DockerSandbox {
  private static isDockerAvailableCache: boolean | null = null;

  public static checkDockerAvailability(): boolean {
    if (this.isDockerAvailableCache !== null) {
      return this.isDockerAvailableCache;
    }
    try {
      execSync("docker info", { stdio: "ignore", timeout: 3000 });
      this.isDockerAvailableCache = true;
    } catch {
      this.isDockerAvailableCache = false;
    }
    return this.isDockerAvailableCache;
  }

  public async runInSandbox(options: SandboxExecutionOptions): Promise<SandboxExecutionResult> {
    const startTime = Date.now();
    const timeoutMs = options.timeoutMs || 30000;
    const image = options.image || "node:20-alpine";
    const memoryLimit = options.memoryLimit || "1g";
    const cpuLimit = options.cpuLimit || "1.0";
    const network = options.networkEnabled ? "bridge" : "none";

    const isDocker = DockerSandbox.checkDockerAvailability();

    if (isDocker) {
      const formattedWorkspace = path.resolve(options.workspacePath).replace(/\\/g, "/");
      const dockerCmd = `docker run --rm --network ${network} --memory=${memoryLimit} --cpus=${cpuLimit} -v "${formattedWorkspace}:/workspace" -w /workspace ${image} sh -c "${options.command.replace(/"/g, '\\"')}"`;

      return new Promise<SandboxExecutionResult>((resolve) => {
        exec(dockerCmd, { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
          const durationMs = Date.now() - startTime;
          const exitCode = error ? (error.code ?? 1) : 0;
          resolve({
            stdout: String(stdout || "").trim(),
            stderr: String(stderr || "").trim(),
            exitCode: typeof exitCode === "number" ? exitCode : 1,
            durationMs,
            usedDockerContainer: true,
            commandExecuted: dockerCmd,
            error: error ? error.message : undefined,
          });
        });
      });
    } else {
      const execOpts: ExecOptions = {
        cwd: options.workspacePath,
        timeout: timeoutMs,
        maxBuffer: 10 * 1024 * 1024,
        env: {
          PATH: process.env.PATH,
          NODE_ENV: "production",
          TMP: options.workspacePath,
          TEMP: options.workspacePath,
        },
      };

      return new Promise<SandboxExecutionResult>((resolve) => {
        exec(options.command, execOpts, (error, stdout, stderr) => {
          const durationMs = Date.now() - startTime;
          const exitCode = error ? (error.code ?? 1) : 0;
          resolve({
            stdout: String(stdout || "").trim(),
            stderr: String(stderr || "").trim(),
            exitCode: typeof exitCode === "number" ? exitCode : 1,
            durationMs,
            usedDockerContainer: false,
            commandExecuted: options.command,
            error: error ? error.message : undefined,
          });
        });
      });
    }
  }
}
