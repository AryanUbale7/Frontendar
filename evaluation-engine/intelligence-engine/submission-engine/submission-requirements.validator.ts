import { VirtualRepository } from "../repository-engine/github-repo.engine";

export interface SubmissionRequirementResult {
  requirementKey: string;
  label: string;
  enabled: boolean;
  passed: boolean;
  mandatory: boolean;
  evidence: string;
}

export interface SubmissionRequirementsReport {
  requirements: SubmissionRequirementResult[];
  totalEnabledCount: number;
  passedCount: number;
  mandatoryPassed: boolean;
  compliancePercent: number;
  evidenceCitations: string[];
}

export class SubmissionRequirementsValidator {
  public validate(
    repo: VirtualRepository,
    repoUrl: string,
    deploymentUrl?: string,
    submissionMetadata?: {
      videoUrl?: string;
      presentationPdf?: string;
      architectureDiagram?: string;
      apiDocsUrl?: string;
    },
    submissionRequirementsConfig?: Record<string, boolean>
  ): SubmissionRequirementsReport {
    const config = submissionRequirementsConfig || {};
    const results: SubmissionRequirementResult[] = [];
    const citations: string[] = [];

    const allFiles = Object.keys(repo.files || {}).map((f) => f.toLowerCase());
    const readmeFile = Object.entries(repo.files || {}).find(([path]) =>
      path.toLowerCase().endsWith("readme.md")
    );
    const readmeContent = readmeFile ? readmeFile[1].content.toLowerCase() : "";

    // 1. GitHub Repository
    if (config.githubRepo !== false) {
      const isGithub = repoUrl.toLowerCase().includes("github.com");
      results.push({
        requirementKey: "githubRepo",
        label: "GitHub Repository URL",
        enabled: true,
        passed: isGithub,
        mandatory: true,
        evidence: isGithub
          ? `Verified valid GitHub repository URL: ${repoUrl}`
          : `Invalid GitHub repository URL: ${repoUrl}`,
      });
      if (isGithub) citations.push(`Submission Requirement PASSED: GitHub Repository (${repoUrl}).`);
      else citations.push(`Submission Requirement FAILED: GitHub Repository URL invalid.`);
    }

    // 2. Live Deployment URL
    if (config.liveDeployment) {
      const hasDeployment = !!(deploymentUrl && deploymentUrl.trim().length > 0);
      results.push({
        requirementKey: "liveDeployment",
        label: "Live Deployment Link",
        enabled: true,
        passed: hasDeployment,
        mandatory: true,
        evidence: hasDeployment
          ? `Verified live deployment URL: ${deploymentUrl}`
          : `Missing required live deployment URL.`,
      });
      if (hasDeployment) citations.push(`Submission Requirement PASSED: Live Deployment URL (${deploymentUrl}).`);
      else citations.push(`Submission Requirement FAILED: Missing Live Deployment Link.`);
    }

    // 3. README Documentation
    if (config.readme) {
      const hasReadme = !!readmeFile && readmeFile[1].content.length > 50;
      results.push({
        requirementKey: "readme",
        label: "README Documentation File",
        enabled: true,
        passed: hasReadme,
        mandatory: true,
        evidence: hasReadme
          ? `Root README.md present (${readmeFile[1].content.length} bytes).`
          : `Root README.md file missing or empty.`,
      });
      if (hasReadme) citations.push(`Submission Requirement PASSED: README.md present.`);
      else citations.push(`Submission Requirement FAILED: README.md missing or empty.`);
    }

    // 4. Video Demo Link
    if (config.videoDemo) {
      const hasVideo = !!(submissionMetadata?.videoUrl && submissionMetadata.videoUrl.trim().length > 0);
      results.push({
        requirementKey: "videoDemo",
        label: "Demo Video Link",
        enabled: true,
        passed: hasVideo,
        mandatory: false,
        evidence: hasVideo
          ? `Verified demo video link: ${submissionMetadata?.videoUrl}`
          : `Demo video link not provided.`,
      });
      if (hasVideo) citations.push(`Submission Requirement PASSED: Demo Video Link.`);
      else citations.push(`Submission Requirement WARNING: Demo Video Link missing.`);
    }

    // 5. Presentation PDF / Slide Deck
    if (config.presentation) {
      const hasPres = !!(
        (submissionMetadata?.presentationPdf && submissionMetadata.presentationPdf.trim().length > 0) ||
        allFiles.some((f) => f.includes("presentation") || f.endsWith(".pdf") || f.includes("slides"))
      );
      results.push({
        requirementKey: "presentation",
        label: "Presentation PDF / Slide Deck",
        enabled: true,
        passed: hasPres,
        mandatory: false,
        evidence: hasPres
          ? `Verified presentation deck.`
          : `Presentation PDF or slide deck not provided.`,
      });
      if (hasPres) citations.push(`Submission Requirement PASSED: Presentation PDF / Slide Deck.`);
    }

    // 6. Architecture Diagram
    if (config.architectureDiagram) {
      const hasArch = !!(
        (submissionMetadata?.architectureDiagram && submissionMetadata.architectureDiagram.trim().length > 0) ||
        allFiles.some(
          (f) =>
            f.includes("architecture") ||
            f.includes("diagram") ||
            f.includes("system-design") ||
            f.endsWith(".drawio") ||
            f.endsWith(".png") ||
            f.endsWith(".svg")
        ) ||
        readmeContent.includes("architecture") ||
        readmeContent.includes("system design")
      );
      results.push({
        requirementKey: "architectureDiagram",
        label: "Architecture Diagram",
        enabled: true,
        passed: hasArch,
        mandatory: false,
        evidence: hasArch
          ? `Verified system architecture documentation / diagram asset.`
          : `Architecture diagram asset not provided.`,
      });
      if (hasArch) citations.push(`Submission Requirement PASSED: Architecture Diagram.`);
    }

    // 7. API Documentation
    if (config.apiDocs) {
      const hasApiDocs = !!(
        allFiles.some((f) => f.includes("swagger") || f.includes("openapi") || f.includes("api-docs")) ||
        readmeContent.includes("api endpoint") ||
        readmeContent.includes("api documentation") ||
        readmeContent.includes("http endpoint")
      );
      results.push({
        requirementKey: "apiDocs",
        label: "API Documentation",
        enabled: true,
        passed: hasApiDocs,
        mandatory: false,
        evidence: hasApiDocs
          ? `Detected API documentation in project files or README.`
          : `API documentation not detected.`,
      });
      if (hasApiDocs) citations.push(`Submission Requirement PASSED: API Documentation.`);
    }

    // 8. Installation Guide
    if (config.installationGuide) {
      const hasInstall =
        readmeContent.includes("install") ||
        readmeContent.includes("npm i") ||
        readmeContent.includes("yarn add") ||
        readmeContent.includes("pnpm add") ||
        readmeContent.includes("getting started");
      results.push({
        requirementKey: "installationGuide",
        label: "Installation Instructions",
        enabled: true,
        passed: hasInstall,
        mandatory: false,
        evidence: hasInstall
          ? `Installation instructions detected in README.md.`
          : `Installation instructions missing from README.md.`,
      });
      if (hasInstall) citations.push(`Submission Requirement PASSED: Installation Instructions.`);
    }

    // 9. Environment Variables Guide
    if (config.envVarsGuide) {
      const hasEnv =
        allFiles.some((f) => f.endsWith(".env.example") || f.endsWith(".env.template") || f.endsWith(".env.sample")) ||
        readmeContent.includes("environment variable") ||
        readmeContent.includes(".env");
      results.push({
        requirementKey: "envVarsGuide",
        label: "Environment Variables Guide",
        enabled: true,
        passed: hasEnv,
        mandatory: false,
        evidence: hasEnv
          ? `Environment variable sample (.env.example) or README section detected.`
          : `Environment variable guide missing.`,
      });
      if (hasEnv) citations.push(`Submission Requirement PASSED: Environment Variables Guide.`);
    }

    const enabledReqs = results.filter((r) => r.enabled);
    const passedReqs = enabledReqs.filter((r) => r.passed);
    const mandatoryReqs = enabledReqs.filter((r) => r.mandatory);
    const mandatoryPassed = mandatoryReqs.every((r) => r.passed);

    const compliancePercent =
      enabledReqs.length > 0 ? Math.round((passedReqs.length / enabledReqs.length) * 100) : 100;

    return {
      requirements: results,
      totalEnabledCount: enabledReqs.length,
      passedCount: passedReqs.length,
      mandatoryPassed,
      compliancePercent,
      evidenceCitations: citations,
    };
  }
}
