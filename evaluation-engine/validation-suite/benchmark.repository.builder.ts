import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface BenchmarkDefinition {
  id: string;
  name: string;
  description: string;
  expectedScore: number;
  expectedStatus: "pass" | "fail";
  expectedFeatureCount: number;
  expectedRejectedClaimsCount: number;
  setupFiles: (dir: string) => void;
}

export class BenchmarkRepositoryBuilder {
  public createBenchmarkSuite(): BenchmarkDefinition[] {
    return [
      {
        id: "bm_01_perfect_app",
        name: "Benchmark 1: Complete Full-Stack Next.js App",
        description: "Full implementation of Authentication, Responsive Dashboard, Prisma DB, and TypeScript (Expected Score ~90-100).",
        expectedScore: 92,
        expectedStatus: "pass",
        expectedFeatureCount: 2,
        expectedRejectedClaimsCount: 0,
        setupFiles: (dir: string) => {
          fs.writeFileSync(
            path.join(dir, "package.json"),
            JSON.stringify({
              name: "perfect-app",
              dependencies: { react: "^18.2.0", next: "^14.0.0", prisma: "^5.0.0", tailwindcss: "^3.0.0", zod: "^3.0.0", recharts: "^2.0.0" },
              devDependencies: { typescript: "^5.0.0" },
            })
          );
          fs.writeFileSync(path.join(dir, "tsconfig.json"), "{}");
          fs.writeFileSync(
            path.join(dir, "README.md"),
            "# Perfect App\n\nFeatures:\n- Authentication login signup auth\n- Responsive Dashboard analytics charts nav navbar button form\n\n## Installation\nnpm install\n\n## Usage\nnpm run dev\n\n## Live\nhttps://perfect-app.vercel.app"
          );

          const appDir = path.join(dir, "app");
          const authDir = path.join(dir, "app", "authentication");
          const dashDir = path.join(dir, "app", "dashboard");
          fs.mkdirSync(authDir, { recursive: true });
          fs.mkdirSync(dashDir, { recursive: true });

          fs.writeFileSync(path.join(authDir, "page.tsx"), "export default function Authentication() { return <form aria-label='login'><button>Login</button></form>; }");
          fs.writeFileSync(path.join(dashDir, "page.tsx"), "export default function Dashboard() { return <nav>Navbar</nav>; }");
        },
      },
      {
        id: "bm_02_false_positive_readme",
        name: "Benchmark 2: False Positive Documentation Claim",
        description: "README claims 'Analytics Dashboard' and 'AI Auth' but no code/routes exist in codebase (Expected False Positive Shield activation).",
        expectedScore: 25,
        expectedStatus: "fail",
        expectedFeatureCount: 0,
        expectedRejectedClaimsCount: 2,
        setupFiles: (dir: string) => {
          fs.writeFileSync(
            path.join(dir, "package.json"),
            JSON.stringify({
              name: "readme-fake-claims",
              dependencies: { react: "^18.2.0" },
            })
          );
          fs.writeFileSync(
            path.join(dir, "README.md"),
            "# Fake Claims App\n\nFeatures:\n- Authentication\n- Interactive Dashboard\n- Stripe Payments"
          );
          const srcDir = path.join(dir, "src");
          fs.mkdirSync(srcDir, { recursive: true });
          fs.writeFileSync(path.join(srcDir, "index.js"), "console.log('empty app');");
        },
      },
      {
        id: "bm_03_leaked_secrets",
        name: "Benchmark 3: Hardcoded API Key Leak & Missing Docs",
        description: "Contains hardcoded Groq API key and missing README file (Expected Security Penalty).",
        expectedScore: 20,
        expectedStatus: "fail",
        expectedFeatureCount: 0,
        expectedRejectedClaimsCount: 0,
        setupFiles: (dir: string) => {
          fs.writeFileSync(
            path.join(dir, "package.json"),
            JSON.stringify({ name: "leaky-app", dependencies: { express: "^4.18.0" } })
          );
          const srcDir = path.join(dir, "src");
          fs.mkdirSync(srcDir, { recursive: true });
          fs.writeFileSync(
            path.join(srcDir, "config.js"),
            "const apiKey = 'gsk_mock_test_key_sample_pattern_12345';"
          );
        },
      },
    ];
  }

  public prepareBenchmarkWorkspace(bm: BenchmarkDefinition): string {
    const tempDir = path.join(os.tmpdir(), `faie_bm_${bm.id}_${Date.now()}`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    bm.setupFiles(tempDir);
    return tempDir;
  }

  public cleanupBenchmarkWorkspace(dirPath: string): void {
    if (fs.existsSync(dirPath)) {
      try {
        fs.rmSync(dirPath, { recursive: true, force: true });
      } catch {}
    }
  }
}
