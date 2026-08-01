import { FAIEOrchestrator } from "../intelligence-engine/faie.orchestrator";
import { KnowledgeBlueprint } from "../intelligence-engine/knowledge-engine/knowledge-blueprint.interface";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";

interface FixtureDefinition {
  id: string;
  name: string;
  expectedMin: number;
  expectedMax: number;
  setup: (dir: string) => void;
}

export class AdversarialRunner {
  private orchestrator = new FAIEOrchestrator();

  public getBlueprint(): KnowledgeBlueprint {
    return {
      problemStatement: {
        title: "Life Dashboard Challenge",
        description: "Build a highly premium personal metrics dashboard.",
      },
      requiredFeatures: [
        {
          id: "KPI Metrics & Summary Cards",
          name: "KPI Metrics & Summary Cards",
          description: "Dashboard layout showing summary indicators.",
          mandatory: true,
          weight: 30,
          expectedRoutes: [],
          expectedComponents: [],
          expectedUIElements: [],
          subFeatures: []
        },
        {
          id: "Interactive Charts & Visualizations",
          name: "Interactive Charts & Visualizations",
          description: "Graphs/charts rendering dynamic data.",
          mandatory: true,
          weight: 40,
          expectedRoutes: [],
          expectedComponents: [],
          expectedUIElements: [],
          subFeatures: []
        },
        {
          id: "Data Table & Filter Controls",
          name: "Data Table & Filter Controls",
          description: "Table with searchable/filterable inputs.",
          mandatory: true,
          weight: 30,
          expectedRoutes: [],
          expectedComponents: [],
          expectedUIElements: [],
          subFeatures: []
        }
      ],
      techStackRules: {
        allowed: ["React", "TailwindCSS"],
        required: ["TypeScript"],
        restricted: []
      },
      confidenceThreshold: 75,
      scoringSystem: {
        categories: [
          { name: "Problem Alignment", weight: 20, maxMarks: 20, passingMarks: 10 },
          { name: "UI/UX & Responsiveness", weight: 20, maxMarks: 20, passingMarks: 10 },
          { name: "Functionality & Interaction", weight: 20, maxMarks: 20, passingMarks: 10 },
          { name: "Data Visualization", weight: 15, maxMarks: 15, passingMarks: 8 },
          { name: "Code Quality", weight: 10, maxMarks: 10, passingMarks: 5 },
          { name: "Performance", weight: 5, maxMarks: 5, passingMarks: 3 },
          { name: "Accessibility", weight: 5, maxMarks: 5, passingMarks: 3 },
          { name: "Creativity / Innovation", weight: 5, maxMarks: 5, passingMarks: 3 }
        ]
      },
      mandatoryRules: [],
      bonusRules: []
    };
  }

  public getFixtures(): FixtureDefinition[] {
    return [
      {
        id: "A",
        name: "Excellent Dashboard",
        expectedMin: 90,
        expectedMax: 100,
        setup: (dir) => {
          fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: { recharts: "^2.0.0", react: "^18.0.0" } }));
          fs.writeFileSync(path.join(dir, "tsconfig.json"), "{}");
          const src = path.join(dir, "src");
          fs.mkdirSync(src, { recursive: true });
          fs.writeFileSync(path.join(src, "Dashboard.tsx"), `
            import React, { useState } from 'react';
            import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
            export default function Dashboard() {
              const [filter, setFilter] = useState('all');
              const data = [{ name: 'Jan', val: 10 }];
              return (
                <div className="grid md:grid-cols-3 theme-dark shadow-glow">
                  <div className="card">Value: {data[0].val}</div>
                  <button onClick={() => setFilter('day')}>Filter</button>
                  <ResponsiveContainer>
                    <LineChart data={data}>
                      <XAxis /><YAxis /><Tooltip /><Legend />
                      <Line dataKey="val" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            }
          `);
          // Add extra files for modularity
          for (let i = 0; i < 5; i++) {
            fs.writeFileSync(path.join(src, `Comp${i}.tsx`), `export function Comp${i}() { return <div aria-label="accessibility">Module</div>; }`);
          }
        }
      },
      {
        id: "B",
        name: "Good Dashboard",
        expectedMin: 75,
        expectedMax: 89,
        setup: (dir) => {
          fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: { recharts: "^2.0.0", react: "^18.0.0" } }));
          fs.writeFileSync(path.join(dir, "tsconfig.json"), "{}");
          const src = path.join(dir, "src");
          fs.mkdirSync(src, { recursive: true });
          fs.writeFileSync(path.join(src, "Dashboard.tsx"), `
            import React, { useState } from 'react';
            import { LineChart, Line, ResponsiveContainer } from 'recharts';
            export default function Dashboard() {
              const [filter, setFilter] = useState('all');
              const data = [{ name: 'Jan', val: 10 }];
              return (
                <div className="md:grid">
                  <div className="card">Val: {data[0].val}</div>
                  <button onClick={() => setFilter('day')}>Filter</button>
                  <ResponsiveContainer><LineChart data={data}><Line dataKey="val" /></LineChart></ResponsiveContainer>
                </div>
              );
            }
          `);
        }
      },
      {
        id: "C",
        name: "Average Dashboard",
        expectedMin: 60,
        expectedMax: 74,
        setup: (dir) => {
          fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: { recharts: "^2.0.0", react: "^18.0.0" } }));
          fs.writeFileSync(path.join(dir, "tsconfig.json"), "{}");
          const src = path.join(dir, "src");
          fs.mkdirSync(src, { recursive: true });
          fs.writeFileSync(path.join(src, "Dashboard.jsx"), `
            import React, { useState } from 'react';
            import { LineChart, Line } from 'recharts';
            export default function Dashboard() {
              const [val, setVal] = useState(10);
              return (
                <div>
                  <div className="card">Value: {val}</div>
                  <LineChart data={[]} />
                </div>
              );
            }
          `);
        }
      },
      {
        id: "D",
        name: "Weak Dashboard",
        expectedMin: 10,
        expectedMax: 39,
        setup: (dir) => {
          fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: {} }));
          const src = path.join(dir, "src");
          fs.mkdirSync(src, { recursive: true });
          fs.writeFileSync(path.join(src, "Dashboard.jsx"), `
            export default function Dashboard() {
              return (
                <div>
                  <div className="card">Metric A: 42</div>
                  <div className="card">Metric B: 17</div>
                  <table>
                    <tr><th>Name</th><th>Value</th></tr>
                    <tr><td>Alpha</td><td>1</td></tr>
                  </table>
                </div>
              );
            }
          `);
        }
      },
      {
        id: "E",
        name: "Broken Dashboard",
        expectedMin: 0,
        expectedMax: 39,
        setup: (dir) => {
          // Empty dir
        }
      },
      {
        id: "F",
        name: "Fake README",
        expectedMin: 0,
        expectedMax: 39,
        setup: (dir) => {
          fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: {} }));
          fs.writeFileSync(path.join(dir, "README.md"), "# Premium Dashboard\\nContains recharts, auth, custom themes.");
          const src = path.join(dir, "src");
          fs.mkdirSync(src, { recursive: true });
          fs.writeFileSync(path.join(src, "App.jsx"), "export default function App() { return <div>Blank</div>; }");
        }
      },
      {
        id: "G",
        name: "Keyword Stuffing",
        expectedMin: 0,
        expectedMax: 39,
        setup: (dir) => {
          fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: {} }));
          const src = path.join(dir, "src");
          fs.mkdirSync(src, { recursive: true });
          fs.writeFileSync(path.join(src, "ResponsiveDashboard.jsx"), "export default function ResponsiveDashboard() { return <div>Hello</div>; }");
          fs.writeFileSync(path.join(src, "MetricSummaryCard.jsx"), "export default function MetricSummaryCard() { return <div>Hello</div>; }");
        }
      },
      {
        id: "H",
        name: "Empty Recharts",
        expectedMin: 0,
        expectedMax: 50,
        setup: (dir) => {
          fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: { recharts: "^2.0.0" } }));
          const src = path.join(dir, "src");
          fs.mkdirSync(src, { recursive: true });
          fs.writeFileSync(path.join(src, "App.jsx"), "import { LineChart } from 'recharts'; export default function App() { return <div>No actual chart rendered</div>; }");
        }
      },
      {
        id: "I",
        name: "Fake Responsive",
        expectedMin: 0,
        expectedMax: 50,
        setup: (dir) => {
          fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: {} }));
          const src = path.join(dir, "src");
          fs.mkdirSync(src, { recursive: true });
          fs.writeFileSync(path.join(src, "App.jsx"), `
            // md:grid md:grid-cols-3 class names commented out here
            export default function App() { return <div>Not responsive</div>; }
          `);
        }
      },
      {
        id: "J",
        name: "Fake Interaction",
        expectedMin: 0,
        expectedMax: 50,
        setup: (dir) => {
          fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: { react: "^18.0.0" } }));
          const src = path.join(dir, "src");
          fs.mkdirSync(src, { recursive: true });
          fs.writeFileSync(path.join(src, "App.jsx"), `
            import React, { useState } from 'react';
            export default function App() {
              const [state, setState] = useState(0); // unused state
              return <div>Static text only</div>;
            }
          `);
        }
      },
      {
        id: "K",
        name: "Copy/Paste Components",
        expectedMin: 0,
        expectedMax: 59,
        setup: (dir) => {
          fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: {} }));
          const src = path.join(dir, "src");
          fs.mkdirSync(src, { recursive: true });
          for (let i = 0; i < 5; i++) {
            fs.writeFileSync(path.join(src, `Comp${i}.jsx`), `export default function Comp() { return <div>Duplicate Boilerplate Content</div>; }`);
          }
        }
      },
      {
        id: "L",
        name: "Excellent JavaScript Dashboard",
        expectedMin: 70,
        expectedMax: 85, // Excellent features but loses 15 pts due to missing TypeScript!
        setup: (dir) => {
          fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ dependencies: { recharts: "^2.0.0", react: "^18.0.0" } }));
          const src = path.join(dir, "src");
          fs.mkdirSync(src, { recursive: true });
          fs.writeFileSync(path.join(src, "Dashboard.jsx"), `
            import React, { useState } from 'react';
            import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
            export default function Dashboard() {
              const [filter, setFilter] = useState('all');
              const data = [{ name: 'Jan', val: 10 }];
              return (
                <div className="grid md:grid-cols-3 theme-dark shadow-glow">
                  <div className="card">Value: {data[0].val}</div>
                  <button onClick={() => setFilter('day')}>Filter</button>
                  <ResponsiveContainer>
                    <LineChart data={data}>
                      <XAxis /><YAxis /><Tooltip /><Legend />
                      <Line dataKey="val" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              );
            }
          `);
          for (let i = 0; i < 5; i++) {
            fs.writeFileSync(path.join(src, `Comp${i}.jsx`), `export function Comp${i}() { return <div aria-label="accessibility">Module</div>; }`);
          }
        }
      }
    ];
  }

  public async run(): Promise<boolean> {
    console.log("=========================================================================");
    console.log("                 RUNNING 12 ADVERSARIAL VALIDATION FIXTURES              ");
    console.log("=========================================================================");
    
    const blueprint = this.getBlueprint();
    const fixtures = this.getFixtures();
    let allPass = true;

    console.log(
      String("Fixture").padEnd(30) + 
      String("Expected").padEnd(12) + 
      String("Actual").padEnd(10) + 
      String("Match").padEnd(10) + 
      String("Selected Blueprint").padEnd(35)
    );
    console.log("-".repeat(100));

    for (const fix of fixtures) {
      const tempDir = path.join(os.tmpdir(), "faie-adversarial-" + fix.id + "-" + Date.now());
      fs.mkdirSync(tempDir, { recursive: true });
      
      try {
        fix.setup(tempDir);
        const report = await this.orchestrator.evaluate(tempDir, `https://github.com/adversarial/${fix.id}`, blueprint);
        
        const score = report.scoreSummary.finalScore;
        const matchesRange = score >= fix.expectedMin && score <= fix.expectedMax;
        if (!matchesRange) allPass = false;

        const rangeStr = `${fix.expectedMin}-${fix.expectedMax}`;
        const matchStr = matchesRange ? "PASS" : "FAIL";
        const bpTitle = report.hackathonTitle;

        console.log(
          `${fix.id}. ${fix.name}`.padEnd(30) + 
          rangeStr.padEnd(12) + 
          String(score).padEnd(10) + 
          matchStr.padEnd(10) + 
          bpTitle.slice(0, 32).padEnd(35)
        );

        // Print capability evidence level details for excellent dashboard
        if (fix.id === "A") {
          console.log("   --> Evidence Levels:");
          report.capabilityVerifications?.forEach((cv: any) => {
            console.log(`       * ${cv.capability}: Level ${cv.evidenceLevel}/5 (confidence: ${cv.confidence}%)`);
          });
        }
      } catch (err) {
        console.error(`Error running fixture ${fix.id}:`, err);
        allPass = false;
      } finally {
        // Clean up
        if (fs.existsSync(tempDir)) {
          try {
            fs.rmSync(tempDir, { recursive: true, force: true });
          } catch {}
        }
      }
    }

    console.log("=========================================================================");
    console.log("Adversarial fixtures validation result:", allPass ? "SUCCESS (ALL PASS)" : "FAILURE");
    console.log("=========================================================================");
    return allPass;
  }
}

if (require.main === module) {
  new AdversarialRunner().run().catch(console.error);
}
