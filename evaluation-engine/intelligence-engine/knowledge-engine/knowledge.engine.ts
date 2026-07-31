import { KnowledgeBlueprint, ProblemStatement, ExpectedFeature } from "./knowledge-blueprint.interface";

export class KnowledgeEngine {
  public validateBlueprint(blueprint: KnowledgeBlueprint): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!blueprint.problemStatement || !blueprint.problemStatement.title) {
      errors.push("KnowledgeBlueprint must include a valid Problem Statement with title.");
    }

    if (!Array.isArray(blueprint.requiredFeatures) || blueprint.requiredFeatures.length === 0) {
      errors.push("KnowledgeBlueprint must define at least one required feature.");
    }

    if (!blueprint.techStackRules) {
      errors.push("KnowledgeBlueprint must define techStackRules.");
    }

    if (!blueprint.scoringSystem || !Array.isArray(blueprint.scoringSystem.categories)) {
      errors.push("KnowledgeBlueprint must configure scoring categories.");
    } else {
      const totalWeight = blueprint.scoringSystem.categories.reduce((acc, cat) => acc + cat.weight, 0);
      if (totalWeight !== 100) {
        errors.push(`Scoring category weights must sum to 100%. Current total: ${totalWeight}%.`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  public getActiveProblemStatement(blueprint: KnowledgeBlueprint): ProblemStatement {
    if (blueprint.problemStatements && blueprint.problemStatements.length > 0) {
      const idx = blueprint.selectedProblemIndex ?? 0;
      return blueprint.problemStatements[idx] || blueprint.problemStatements[0];
    }
    return blueprint.problemStatement;
  }

  public normalizeFeatures(blueprint: KnowledgeBlueprint): ExpectedFeature[] {
    return blueprint.requiredFeatures.map((f, idx) => ({
      id: f.id || `feat_${idx + 1}`,
      name: f.name,
      description: f.description || "",
      mandatory: !!f.mandatory,
      weight: f.weight || 10,
      keywords: f.keywords || [f.name.toLowerCase()],
      synonyms: f.synonyms || []
    }));
  }
}
