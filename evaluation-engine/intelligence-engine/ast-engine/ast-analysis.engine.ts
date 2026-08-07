import * as ts from "typescript";
import { VirtualRepository, VirtualFile } from "../repository-engine/github-repo.engine";

export interface ASTImport {
  module: string;
  importedNames: string[];
  defaultImport?: string;
  isNamespace: boolean;
  line: number;
}

export interface ASTJSXElement {
  tagName: string;
  attributes: string[];
  isSelfClosing: boolean;
  line: number;
}

export interface ASTCallExpression {
  expressionName: string;
  argumentsCount: number;
  line: number;
}

export interface ASTFileAnalysis {
  filePath: string;
  imports: ASTImport[];
  jsxElements: ASTJSXElement[];
  callExpressions: ASTCallExpression[];
  functionNames: string[];
  hooksUsed: string[];
  customHooks: string[];
  commentsCount: number;
  linesOfCode: number;
}

export interface ASTRepositoryAnalysis {
  fileAnalyses: Record<string, ASTFileAnalysis>;
  allImports: Set<string>;
  allJsxTags: Set<string>;
  allCallExpressions: Set<string>;
  allHooks: Set<string>;
  totalJsxElements: number;
  totalFunctions: number;
  totalCustomHooks: number;
  linesOfCodeTotal: number;
}

export class ASTAnalysisEngine {
  public analyzeRepository(repo: VirtualRepository): ASTRepositoryAnalysis {
    const fileAnalyses: Record<string, ASTFileAnalysis> = {};
    const allImports = new Set<string>();
    const allJsxTags = new Set<string>();
    const allCallExpressions = new Set<string>();
    const allHooks = new Set<string>();
    let totalJsxElements = 0;
    let totalFunctions = 0;
    let totalCustomHooks = 0;
    let linesOfCodeTotal = 0;

    for (const [relPath, virtualFile] of Object.entries(repo.files)) {
      const ext = relPath.slice(relPath.lastIndexOf(".")).toLowerCase();
      if (![".ts", ".tsx", ".js", ".jsx"].includes(ext)) continue;

      const analysis = this.analyzeSingleFile(virtualFile, ext);
      fileAnalyses[relPath] = analysis;

      analysis.imports.forEach((imp) => allImports.add(imp.module));
      analysis.jsxElements.forEach((jsx) => {
        allJsxTags.add(jsx.tagName);
        totalJsxElements++;
      });
      analysis.callExpressions.forEach((call) => allCallExpressions.add(call.expressionName));
      analysis.hooksUsed.forEach((hook) => allHooks.add(hook));

      totalFunctions += analysis.functionNames.length;
      totalCustomHooks += analysis.customHooks.length;
      linesOfCodeTotal += analysis.linesOfCode;
    }

    return {
      fileAnalyses,
      allImports,
      allJsxTags,
      allCallExpressions,
      allHooks,
      totalJsxElements,
      totalFunctions,
      totalCustomHooks,
      linesOfCodeTotal
    };
  }

  public analyzeSingleFile(file: VirtualFile, ext: string): ASTFileAnalysis {
    const scriptKind = ext === ".tsx" || ext === ".jsx" ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sourceFile = ts.createSourceFile(file.path, file.content, ts.ScriptTarget.Latest, true, scriptKind);

    const imports: ASTImport[] = [];
    const jsxElements: ASTJSXElement[] = [];
    const callExpressions: ASTCallExpression[] = [];
    const functionNames: string[] = [];
    const hooksUsed: string[] = [];
    const customHooks: string[] = [];
    let commentsCount = 0;

    const linesOfCode = file.content.split(/\r\n|\r|\n/).length;

    const getLineNumber = (pos: number) => {
      return sourceFile.getLineAndCharacterOfPosition(pos).line + 1;
    };

    const visitNode = (node: ts.Node) => {
      // 1. Import Statements
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
          const moduleName = moduleSpecifier.text;
          const importedNames: string[] = [];
          let defaultImport: string | undefined;
          let isNamespace = false;

          if (node.importClause) {
            if (node.importClause.name) {
              defaultImport = node.importClause.name.text;
            }
            if (node.importClause.namedBindings) {
              if (ts.isNamespaceImport(node.importClause.namedBindings)) {
                isNamespace = true;
              } else if (ts.isNamedImports(node.importClause.namedBindings)) {
                node.importClause.namedBindings.elements.forEach((el) => {
                  importedNames.push(el.name.text);
                });
              }
            }
          }

          imports.push({
            module: moduleName,
            importedNames,
            defaultImport,
            isNamespace,
            line: getLineNumber(node.getStart(sourceFile))
          });
        }
      }

      // 2. JSX Elements & Self Closing Elements
      if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = ts.isJsxElement(node) ? node.openingElement : node;
        const tagName = tag.tagName.getText(sourceFile);
        const attributes: string[] = [];

        tag.attributes.properties.forEach((prop) => {
          if (ts.isJsxAttribute(prop)) {
            attributes.push(prop.name.getText(sourceFile));
          }
        });

        jsxElements.push({
          tagName,
          attributes,
          isSelfClosing: ts.isJsxSelfClosingElement(node),
          line: getLineNumber(node.getStart(sourceFile))
        });
      }

      // 3. Call Expressions & Hooks
      if (ts.isCallExpression(node)) {
        const expressionText = node.expression.getText(sourceFile);
        callExpressions.push({
          expressionName: expressionText,
          argumentsCount: node.arguments.length,
          line: getLineNumber(node.getStart(sourceFile))
        });

        if (expressionText.startsWith("use") && expressionText.length > 3) {
          hooksUsed.push(expressionText);
        }
      }

      // 4. Function Declarations / Arrow Functions
      if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node)) {
        let name = "";
        if (ts.isFunctionDeclaration(node) && node.name) {
          name = node.name.text;
        } else if (ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) {
          name = node.parent.name.text;
        }

        if (name) {
          functionNames.push(name);
          if (name.startsWith("use") && name.length > 3 && /[A-Z]/.test(name[3])) {
            customHooks.push(name);
          }
        }
      }

      ts.forEachChild(node, visitNode);
    };

    visitNode(sourceFile);

    // Simple comment density check
    const commentMatches = file.content.match(/\/\*[\s\S]*?\*\/|\/\/.*/g);
    if (commentMatches) commentsCount = commentMatches.length;

    return {
      filePath: file.path,
      imports,
      jsxElements,
      callExpressions,
      functionNames,
      hooksUsed,
      customHooks,
      commentsCount,
      linesOfCode
    };
  }
}
