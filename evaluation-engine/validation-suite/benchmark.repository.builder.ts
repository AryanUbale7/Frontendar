import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface BenchmarkDefinition {
  id: string;
  name: string;
  category: string;
  framework: "Next.js" | "React + Vite" | "Vue" | "Angular" | "Static HTML";
  description: string;
  expectedScore: number;
  expectedGrade: "PASSED" | "FAILED" | "EXCELLENT" | "NEEDS_REVISION";
  expectedStatus: "pass" | "fail";
  expectedFeatureCoverage: number;
  expectedRejectedClaimsCount: number;
  setupFiles: (dir: string) => void;
}

export class BenchmarkRepositoryBuilder {
  public createBenchmarkSuite(): BenchmarkDefinition[] {
    const benchmarks: BenchmarkDefinition[] = [];

    const frameworks: BenchmarkDefinition["framework"][] = [
      "Next.js",
      "React + Vite",
      "Vue",
      "Angular",
      "Static HTML",
    ];

    let idCounter = 1;

    frameworks.forEach((fw) => {
      // 1. Perfect Project
      benchmarks.push({
        id: `bm_${String(idCounter++).padStart(2, "0")}_perfect_${fw.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        name: `Benchmark #${idCounter - 1}: Perfect ${fw} Application`,
        category: "Perfect Project",
        framework: fw,
        description: `Flawless ${fw} implementation with full authentication, dashboard, clean TypeScript, responsive layout & docs.`,
        expectedScore: 80,
        expectedGrade: "PASSED",
        expectedStatus: "pass",
        expectedFeatureCoverage: 100,
        expectedRejectedClaimsCount: 0,
        setupFiles: (dir) => this.setupPerfectApp(dir, fw),
      });

      // 2. Good Project
      benchmarks.push({
        id: `bm_${String(idCounter++).padStart(2, "0")}_good_${fw.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        name: `Benchmark #${idCounter - 1}: Good ${fw} Application`,
        category: "Good Project",
        framework: fw,
        description: `Solid ${fw} app with minor lint warnings but good feature coverage.`,
        expectedScore: 80,
        expectedGrade: "PASSED",
        expectedStatus: "pass",
        expectedFeatureCoverage: 80,
        expectedRejectedClaimsCount: 0,
        setupFiles: (dir) => this.setupGoodApp(dir, fw),
      });

      // 3. Average Project
      benchmarks.push({
        id: `bm_${String(idCounter++).padStart(2, "0")}_average_${fw.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        name: `Benchmark #${idCounter - 1}: Average ${fw} Application`,
        category: "Average Project",
        framework: fw,
        description: `Basic ${fw} app with partial UI components and basic docs.`,
        expectedScore: 74,
        expectedGrade: "PASSED",
        expectedStatus: "pass",
        expectedFeatureCoverage: 80,
        expectedRejectedClaimsCount: 0,
        setupFiles: (dir) => this.setupAverageApp(dir, fw),
      });

      // 4. Poor Project
      benchmarks.push({
        id: `bm_${String(idCounter++).padStart(2, "0")}_poor_${fw.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        name: `Benchmark #${idCounter - 1}: Poor ${fw} Application`,
        category: "Poor Project",
        framework: fw,
        description: `Low quality ${fw} project missing mandatory features.`,
        expectedScore: 16,
        expectedGrade: "FAILED",
        expectedStatus: "fail",
        expectedFeatureCoverage: 0,
        expectedRejectedClaimsCount: 0,
        setupFiles: (dir) => this.setupPoorApp(dir, fw),
      });

      // 5. Fake README
      benchmarks.push({
        id: `bm_${String(idCounter++).padStart(2, "0")}_fake_readme_${fw.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        name: `Benchmark #${idCounter - 1}: Fake README ${fw} App`,
        category: "Fake README",
        framework: fw,
        description: `README boasts advanced features but zero code/routes exist in ${fw} workspace.`,
        expectedScore: 7,
        expectedGrade: "FAILED",
        expectedStatus: "fail",
        expectedFeatureCoverage: 0,
        expectedRejectedClaimsCount: 2,
        setupFiles: (dir) => this.setupFakeReadmeApp(dir, fw),
      });

      // 6. Hardcoded Secrets
      benchmarks.push({
        id: `bm_${String(idCounter++).padStart(2, "0")}_hardcoded_secrets_${fw.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        name: `Benchmark #${idCounter - 1}: Hardcoded Secret Leaks ${fw}`,
        category: "Hardcoded Secrets",
        framework: fw,
        description: `Contains hardcoded API key secret in ${fw} configuration.`,
        expectedScore: 16,
        expectedGrade: "FAILED",
        expectedStatus: "fail",
        expectedFeatureCoverage: 0,
        expectedRejectedClaimsCount: 0,
        setupFiles: (dir) => this.setupHardcodedSecretsApp(dir, fw),
      });

      // 7. Missing Documentation
      benchmarks.push({
        id: `bm_${String(idCounter++).padStart(2, "0")}_missing_docs_${fw.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        name: `Benchmark #${idCounter - 1}: Missing Docs ${fw}`,
        category: "Missing Documentation",
        framework: fw,
        description: `Code exists for ${fw} but README file is missing.`,
        expectedScore: 16,
        expectedGrade: "FAILED",
        expectedStatus: "fail",
        expectedFeatureCoverage: 0,
        expectedRejectedClaimsCount: 0,
        setupFiles: (dir) => this.setupMissingDocsApp(dir, fw),
      });

      // 8. Wrong Tech Stack
      benchmarks.push({
        id: `bm_${String(idCounter++).padStart(2, "0")}_wrong_stack_${fw.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        name: `Benchmark #${idCounter - 1}: Restricted Tech Stack ${fw}`,
        category: "Wrong Tech Stack",
        framework: fw,
        description: `Uses restricted dependencies (e.g. jQuery) violating tech stack rules.`,
        expectedScore: 16,
        expectedGrade: "FAILED",
        expectedStatus: "fail",
        expectedFeatureCoverage: 0,
        expectedRejectedClaimsCount: 0,
        setupFiles: (dir) => this.setupWrongStackApp(dir, fw),
      });

      // 9. Responsive Failures
      benchmarks.push({
        id: `bm_${String(idCounter++).padStart(2, "0")}_responsive_fail_${fw.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        name: `Benchmark #${idCounter - 1}: Responsive Failures ${fw}`,
        category: "Responsive Failures",
        framework: fw,
        description: `Fixed pixel widths causing mobile layout overflow in ${fw}.`,
        expectedScore: 16,
        expectedGrade: "FAILED",
        expectedStatus: "fail",
        expectedFeatureCoverage: 0,
        expectedRejectedClaimsCount: 0,
        setupFiles: (dir) => this.setupResponsiveFailApp(dir, fw),
      });

      // 10. Broken Build
      benchmarks.push({
        id: `bm_${String(idCounter++).padStart(2, "0")}_broken_build_${fw.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
        name: `Benchmark #${idCounter - 1}: Broken Build ${fw}`,
        category: "Broken Build",
        framework: fw,
        description: `Syntax errors in ${fw} source files causing compiler build crash.`,
        expectedScore: 16,
        expectedGrade: "FAILED",
        expectedStatus: "fail",
        expectedFeatureCoverage: 0,
        expectedRejectedClaimsCount: 0,
        setupFiles: (dir) => this.setupBrokenBuildApp(dir, fw),
      });
    });

    return benchmarks;
  }

  public prepareBenchmarkWorkspace(bm: BenchmarkDefinition): string {
    const tempDir = path.join(os.tmpdir(), `faie_bm50_${bm.id}_${Date.now()}`);
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

  // --- BENCHMARK SETUP HELPERS ---

  private setupPerfectApp(dir: string, fw: string): void {
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({
        name: `perfect-${fw.toLowerCase().replace(/[^a-z]/g, "")}`,
        dependencies: { react: "^18.2.0", next: "^14.0.0", tailwindcss: "^3.0.0", prisma: "^5.0.0" },
        devDependencies: { typescript: "^5.0.0" },
      })
    );
    fs.writeFileSync(path.join(dir, "tsconfig.json"), "{}");
    fs.writeFileSync(
      path.join(dir, "README.md"),
      `# Perfect ${fw} Application\n\nFeatures:\n- Authentication login signup auth\n- Responsive Dashboard analytics nav navbar charts\n\nLive Demo: https://perfect-${fw.toLowerCase()}.vercel.app`
    );

    const appDir = path.join(dir, "app");
    fs.mkdirSync(path.join(appDir, "authentication"), { recursive: true });
    fs.mkdirSync(path.join(appDir, "dashboard"), { recursive: true });

    fs.writeFileSync(
      path.join(appDir, "authentication", "page.tsx"),
      "export default function AuthPage() { return <form aria-label='login'><button>Login</button></form>; }"
    );
    fs.writeFileSync(
      path.join(appDir, "dashboard", "page.tsx"),
      "export default function Dashboard() { return <nav>Navbar</nav>; }"
    );
  }

  private setupGoodApp(dir: string, fw: string): void {
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({
        name: `good-${fw.toLowerCase().replace(/[^a-z]/g, "")}`,
        dependencies: { react: "^18.2.0", tailwindcss: "^3.0.0" },
        devDependencies: { typescript: "^5.0.0" },
      })
    );
    fs.writeFileSync(path.join(dir, "tsconfig.json"), "{}");
    fs.writeFileSync(
      path.join(dir, "README.md"),
      `# Good ${fw} Application\n\nFeatures:\n- Authentication auth login\n- Responsive Dashboard analytics`
    );

    const appDir = path.join(dir, "app");
    fs.mkdirSync(path.join(appDir, "auth"), { recursive: true });
    fs.mkdirSync(path.join(appDir, "dashboard"), { recursive: true });

    fs.writeFileSync(path.join(appDir, "auth", "page.tsx"), "export default function Auth() { return <form><button>Submit</button></form>; }");
    fs.writeFileSync(path.join(appDir, "dashboard", "page.tsx"), "export default function Dashboard() { return <div>Analytics</div>; }");
  }

  private setupAverageApp(dir: string, fw: string): void {
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({
        name: `average-${fw.toLowerCase().replace(/[^a-z]/g, "")}`,
        dependencies: { react: "^18.2.0", tailwindcss: "^3.0.0" },
      })
    );
    fs.writeFileSync(
      path.join(dir, "README.md"),
      `# Average ${fw} App\n\nFeatures:\n- Authentication auth login\n- Responsive Dashboard analytics`
    );
    const appDir = path.join(dir, "app");
    fs.mkdirSync(path.join(appDir, "auth"), { recursive: true });
    fs.mkdirSync(path.join(appDir, "dashboard"), { recursive: true });

    fs.writeFileSync(path.join(appDir, "auth", "page.jsx"), "export default function Auth() { return <form><button>Login</button></form>; }");
    fs.writeFileSync(path.join(appDir, "dashboard", "page.jsx"), "export default function Dashboard() { return <div>Analytics</div>; }");
  }

  private setupPoorApp(dir: string, fw: string): void {
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ name: `poor-${fw.toLowerCase().replace(/[^a-z]/g, "")}`, dependencies: {} })
    );
    fs.writeFileSync(path.join(dir, "README.md"), `# Poor ${fw} App\nMinimal code structure.`);
    const srcDir = path.join(dir, "src");
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, "main.js"), "console.log('empty');");
  }

  private setupFakeReadmeApp(dir: string, fw: string): void {
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ name: `fake-readme-${fw.toLowerCase().replace(/[^a-z]/g, "")}`, dependencies: { react: "^18.2.0" } })
    );
    fs.writeFileSync(
      path.join(dir, "README.md"),
      `# Fake Claims ${fw} App\n\nFeatures:\n- Authentication\n- Interactive Dashboard\n- Stripe Payment Gateway`
    );
    const srcDir = path.join(dir, "src");
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, "index.js"), "console.log('empty repository');");
  }

  private setupHardcodedSecretsApp(dir: string, fw: string): void {
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ name: `leaky-${fw.toLowerCase().replace(/[^a-z]/g, "")}`, dependencies: {} })
    );
    fs.writeFileSync(path.join(dir, "README.md"), `# Leaky Secrets ${fw} App`);
    const srcDir = path.join(dir, "src");
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, "config.js"), "const secretKey = 'gsk_mock_test_key_sample_pattern_12345';");
  }

  private setupMissingDocsApp(dir: string, fw: string): void {
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ name: `no-docs-${fw.toLowerCase().replace(/[^a-z]/g, "")}`, dependencies: { react: "^18.2.0" } })
    );
    const srcDir = path.join(dir, "src");
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, "index.js"), "export function Auth() { return <div>Auth</div>; }");
  }

  private setupWrongStackApp(dir: string, fw: string): void {
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({
        name: `restricted-stack-${fw.toLowerCase().replace(/[^a-z]/g, "")}`,
        dependencies: { jquery: "^3.6.0" },
      })
    );
    fs.writeFileSync(path.join(dir, "README.md"), `# Restricted Stack ${fw} App`);
    const srcDir = path.join(dir, "src");
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, "index.js"), "$('body').html('jQuery app');");
  }

  private setupResponsiveFailApp(dir: string, fw: string): void {
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ name: `responsive-fail-${fw.toLowerCase().replace(/[^a-z]/g, "")}`, dependencies: { react: "^18.2.0" } })
    );
    fs.writeFileSync(path.join(dir, "README.md"), `# Responsive Fail ${fw} App`);
    const srcDir = path.join(dir, "src");
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, "index.css"), ".container { width: 2400px !important; overflow: hidden; }");
  }

  private setupBrokenBuildApp(dir: string, fw: string): void {
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ name: `broken-${fw.toLowerCase().replace(/[^a-z]/g, "")}`, dependencies: {} })
    );
    fs.writeFileSync(path.join(dir, "README.md"), `# Broken Build ${fw} App`);
    const srcDir = path.join(dir, "src");
    fs.mkdirSync(srcDir, { recursive: true });
    fs.writeFileSync(path.join(srcDir, "index.ts"), "const x: number = 'broken string type syntax failure';");
  }
}
