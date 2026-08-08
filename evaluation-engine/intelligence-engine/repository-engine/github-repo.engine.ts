import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import * as https from "https";

export interface VirtualFile {
  path: string;
  content: string;
  size: number;
}

export interface VirtualRepository {
  owner: string;
  repo: string;
  defaultBranch: string;
  commitSha?: string;
  isPublic: boolean;
  totalFilesCount: number;
  downloadedFilesCount: number;
  files: Record<string, VirtualFile>;
  packageJson: any | null;
  hasReadme: boolean;
  readmeContent: string;
  hasTsConfig: boolean;
}

const ALLOWED_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".vue", ".svelte",
  ".json", ".css", ".scss", ".html", ".md"
]);

const IGNORED_PATHS = [
  "node_modules/", "dist/", "build/", ".next/", "out/",
  "coverage/", ".git/", "public/media/", "videos/",
  "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb"
];

const MAX_FILE_SIZE_BYTES = 500 * 1024; // 500 KB limit per file
const MAX_TOTAL_FILES_DOWNLOAD = 60; // Max 60 files per evaluation

export class GitHubRepoEngine {
  private githubToken: string;

  constructor(token?: string) {
    this.githubToken = token || process.env.GITHUB_TOKEN || "";
  }

  public parseGitHubUrl(repoUrl: string): { owner: string; repo: string } | null {
    if (!repoUrl) return null;
    let clean = repoUrl.trim();
    clean = clean.replace(/\.git$/, "");
    
    // Match https://github.com/owner/repo or git@github.com:owner/repo
    const match = clean.match(/github\.com[/:]([^/]+)\/([^/]+)/i);
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
  }

  private fetchUrl(url: string, headers: Record<string, string> = {}): Promise<{ statusCode: number; data: string }> {
    return new Promise((resolve, reject) => {
      const isHttps = url.startsWith("https:");
      const client = isHttps ? https : http;
      
      const defaultHeaders: Record<string, string> = {
        "User-Agent": "FrontendArena-FAIEv3-Engine",
        ...headers
      };

      if (this.githubToken && url.includes("api.github.com")) {
        defaultHeaders["Authorization"] = `Bearer ${this.githubToken}`;
      }

      const req = client.get(url, { headers: defaultHeaders }, (res) => {
        let body = "";
        res.setEncoding("utf-8");
        res.on("data", (chunk) => { body += chunk; });
        res.on("end", () => {
          resolve({ statusCode: res.statusCode || 200, data: body });
        });
      });

      req.on("error", (err) => reject(err));
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error(`HTTP request timed out after 10s: ${url}`));
      });
    });
  }

  public async loadRepository(source: string): Promise<VirtualRepository> {
    // If source is a local directory path (e.g. for testing / local fallbacks)
    if (fs.existsSync(source) && fs.statSync(source).isDirectory()) {
      return this.loadLocalDirectory(source);
    }

    const parsed = this.parseGitHubUrl(source);
    if (!parsed) {
      throw new Error(`Invalid GitHub repository URL: ${source}`);
    }

    const { owner, repo } = parsed;

    // 1. Fetch Repository Metadata
    const repoInfoRes = await this.fetchUrl(`https://api.github.com/repos/${owner}/${repo}`);
    let defaultBranch = "main";
    let isPublic = true;

    if (repoInfoRes.statusCode === 200) {
      try {
        const repoMeta = JSON.parse(repoInfoRes.data);
        defaultBranch = repoMeta.default_branch || "main";
        isPublic = !repoMeta.private;
      } catch {}
    } else if (repoInfoRes.statusCode === 404) {
      throw new Error(`GitHub repository not found or private: ${owner}/${repo}`);
    }

    // 2. Fetch Git Tree recursively
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`;
    const treeRes = await this.fetchUrl(treeUrl);

    if (treeRes.statusCode !== 200) {
      throw new Error(`Failed to fetch GitHub tree for ${owner}/${repo} (HTTP ${treeRes.statusCode}).`);
    }

    let treeItems: Array<{ path: string; type: string; size?: number }> = [];
    let commitSha: string | undefined = undefined;
    try {
      const treeJson = JSON.parse(treeRes.data);
      treeItems = treeJson.tree || [];
      commitSha = treeJson.sha || undefined;
    } catch (e: any) {
      throw new Error(`Failed to parse GitHub tree response: ${e.message}`);
    }

    // Filter relevant files
    const relevantItems = treeItems.filter((item) => {
      if (item.type !== "blob") return false;
      const p = item.path;
      if (IGNORED_PATHS.some((ignored) => p.includes(ignored))) return false;
      const ext = path.extname(p).toLowerCase();
      return ALLOWED_EXTENSIONS.has(ext);
    });

    // Prioritize source code files
    relevantItems.sort((a, b) => {
      const scoreA = a.path.startsWith("src/") || a.path.startsWith("app/") || a.path === "package.json" ? 0 : 1;
      const scoreB = b.path.startsWith("src/") || b.path.startsWith("app/") || b.path === "package.json" ? 0 : 1;
      return scoreA - scoreB;
    });

    const targetItems = relevantItems.slice(0, MAX_TOTAL_FILES_DOWNLOAD);
    const virtualFiles: Record<string, VirtualFile> = {};

    // 3. Batch download file contents (Concurrency throttled)
    const batchSize = 10;
    for (let i = 0; i < targetItems.length; i += batchSize) {
      const chunk = targetItems.slice(i, i + batchSize);
      await Promise.all(
        chunk.map(async (item) => {
          try {
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${item.path}`;
            const res = await this.fetchUrl(rawUrl);
            if (res.statusCode === 200) {
              virtualFiles[item.path] = {
                path: item.path,
                content: res.data,
                size: item.size || Buffer.byteLength(res.data)
              };
            }
          } catch (e) {
            // Silently swallow single-file download errors to maintain evaluation resilience
          }
        })
      );
    }

    // Extract package.json
    let packageJson: any = null;
    if (virtualFiles["package.json"]) {
      try {
        packageJson = JSON.parse(virtualFiles["package.json"].content);
      } catch {}
    }

    // Extract README
    const readmeKey = Object.keys(virtualFiles).find((k) => k.toLowerCase().startsWith("readme"));
    const hasReadme = !!readmeKey;
    const readmeContent = readmeKey ? virtualFiles[readmeKey].content : "";
    const hasTsConfig = !!virtualFiles["tsconfig.json"];

    return {
      owner,
      repo,
      defaultBranch,
      commitSha,
      isPublic,
      totalFilesCount: treeItems.length,
      downloadedFilesCount: Object.keys(virtualFiles).length,
      files: virtualFiles,
      packageJson,
      hasReadme,
      readmeContent,
      hasTsConfig
    };
  }

  private loadLocalDirectory(dirPath: string): VirtualRepository {
    const virtualFiles: Record<string, VirtualFile> = {};

    const walk = (currentDir: string, relPath: string = "") => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const entryRel = relPath ? `${relPath}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          if (!IGNORED_PATHS.some((ignored) => `${entryRel}/`.includes(ignored))) {
            walk(path.join(currentDir, entry.name), entryRel);
          }
        } else if (entry.isFile()) {
          if (IGNORED_PATHS.some((ignored) => entryRel.includes(ignored))) continue;
          const ext = path.extname(entry.name).toLowerCase();
          if (ALLOWED_EXTENSIONS.has(ext)) {
            try {
              const fullPath = path.join(currentDir, entry.name);
              const stat = fs.statSync(fullPath);
              if (stat.size <= MAX_FILE_SIZE_BYTES) {
                const content = fs.readFileSync(fullPath, "utf-8");
                virtualFiles[entryRel] = {
                  path: entryRel,
                  content,
                  size: stat.size
                };
              }
            } catch {}
          }
        }
      }
    };

    walk(dirPath);

    let packageJson: any = null;
    if (virtualFiles["package.json"]) {
      try {
        packageJson = JSON.parse(virtualFiles["package.json"].content);
      } catch {}
    }

    const readmeKey = Object.keys(virtualFiles).find((k) => k.toLowerCase().startsWith("readme"));
    const hasReadme = !!readmeKey;
    const readmeContent = readmeKey ? virtualFiles[readmeKey].content : "";

    return {
      owner: "local",
      repo: path.basename(dirPath),
      defaultBranch: "main",
      isPublic: true,
      totalFilesCount: Object.keys(virtualFiles).length,
      downloadedFilesCount: Object.keys(virtualFiles).length,
      files: virtualFiles,
      packageJson,
      hasReadme,
      readmeContent,
      hasTsConfig: !!virtualFiles["tsconfig.json"]
    };
  }
}
