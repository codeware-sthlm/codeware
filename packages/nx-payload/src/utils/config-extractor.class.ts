import ts from 'typescript';

import type { ConfigPropertyPath } from './extract-payload-config';

// Helper type to allow any once
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ANY = any;

/**
 * Extract the Payload config object from the provided absolute path.
 *
 * The extraction is done by parsing the TypeScript source file,
 * which comes with some limitations by design:
 *
 * - The config object must be exported using `export default buildConfig()`
 * - Functions are replaced with their string representation in the result
 * - The config object is assumed to be a valid Payload config when returned,
 *   due to the file being type-safe by design
 *
 * @todo Better documentation
 */
export class ConfigExtractor {
  private variables: Map<string, ANY>;
  private checker: ts.TypeChecker;
  private configObject: ANY | null;
  private targetProperties: Set<string> | null;
  private processedPaths: Set<string>;

  constructor(
    private sourceFile: ts.SourceFile,
    checker: ts.TypeChecker,
    properties?: ConfigPropertyPath | Array<ConfigPropertyPath>
  ) {
    this.variables = new Map();
    this.checker = checker;
    this.configObject = null;
    this.processedPaths = new Set();
    this.targetProperties = this.normalizeProperties(properties);
  }

  /**
   * Extracts the Payload config object from the source file.
   *
   * This method traverses the AST of the source file to find the export
   * assignment of the buildConfig function and extracts the config object.
   *
   * @returns The extracted config object or null if not found.
   */
  extract(): ANY | null {
    this.collectVariables();
    const findBuildConfig = (node: ts.Node): void => {
      if (ts.isExportAssignment(node)) {
        const expression = node.expression;
        if (
          ts.isCallExpression(expression) &&
          expression.expression.getText() === 'buildConfig'
        ) {
          const [configArg] = expression.arguments;
          if (configArg) {
            if (ts.isObjectLiteralExpression(configArg)) {
              this.configObject = this.parseObjectLiteral(configArg);
            } else if (ts.isIdentifier(configArg)) {
              const configVar = configArg.getText();
              const config = this.variables.get(configVar);
              if (config) {
                this.configObject = config;
              }
            }
          }
        }
      }
      ts.forEachChild(node, findBuildConfig);
    };

    findBuildConfig(this.sourceFile);
    return this.configObject;
  }

  /**
   * Gets the properties that are missing from the processed paths.
   *
   * This method compares the target properties with the processed paths
   * to identify which properties have not been processed.
   *
   * @returns An array of strings representing the missing properties.
   */
  getMissingProperties(): Array<string> {
    return Array.from(this.targetProperties ?? []).filter(
      (prop) => !this.processedPaths.has(prop)
    );
  }

  /**
   * Normalizes the provided properties into a Set of strings.
   *
   * This method ensures that the properties are stored in a consistent format
   * for further processing.
   *
   * @param properties - A single property or an array of properties to normalize.
   * @returns A Set of normalized property paths or null if no properties are provided.
   */
  private normalizeProperties(
    properties?: ConfigPropertyPath | Array<ConfigPropertyPath>
  ): Set<string> | null {
    if (!properties) {
      return null;
    }

    const props = Array.isArray(properties) ? properties : [properties];

    return new Set(props);
  }

  /**
   * Determines whether a property should be processed based on the target properties.
   *
   * This method checks if the property path matches any of the target properties,
   * allowing for root paths, exact matches, and wildcard matches (e.g., 'admin.*').
   * It also tracks processed paths to avoid reprocessing.
   *
   * @param propertyPath - An array of strings representing the path of the property.
   * @returns A boolean indicating if the property should be processed.
   */
  private shouldProcessProperty(propertyPath: Array<string>): boolean {
    if (!this.targetProperties) {
      return true;
    }

    const fullPath = propertyPath.join('.');
    this.processedPaths.add(fullPath);

    return Array.from(this.targetProperties).some((targetPath) => {
      // For root path, always process
      if (fullPath === '') return true;

      // Exact match
      if (targetPath === fullPath) return true;

      // When requesting 'admin', we need to process 'admin.*'
      if (targetPath === propertyPath[0]) return true;

      // When requesting 'admin.something', we need to process 'admin'
      if (fullPath === targetPath.split('.')[0]) return true;

      // When requesting nested property, process all parts of the path
      return (
        targetPath.startsWith(fullPath + '.') ||
        fullPath.startsWith(targetPath + '.')
      );
    });
  }

  /**
   * Collects variable declarations from the source file.
   *
   * This method traverses the AST to find variable statements and stores
   * their initial values in the variables map for later use.
   */
  private collectVariables(): void {
    const visit = (node: ts.Node): void => {
      if (ts.isVariableStatement(node)) {
        for (const declaration of node.declarationList.declarations) {
          if (declaration.initializer) {
            const name = declaration.name.getText();

            if (ts.isObjectLiteralExpression(declaration.initializer)) {
              const obj: Record<string, ANY> = {};

              for (const prop of declaration.initializer.properties) {
                if (ts.isPropertyAssignment(prop)) {
                  const propName = prop.name.getText();
                  const value = this.parseNode(prop.initializer);
                  obj[propName] = value;
                }
              }

              this.variables.set(name, obj);
            } else {
              const value = this.parseNode(declaration.initializer);
              this.variables.set(name, value);
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(this.sourceFile);
  }

  /**
   * Resolves the value of a variable based on its identifier or property access.
   *
   * This method checks if the variable is defined and retrieves its value
   * from the variables map or resolves it through property access.
   *
   * @param node - The AST node representing the variable or property access.
   * @param propertyPath - An array of strings representing the path of the property.
   * @returns The resolved value or undefined if not found.
   */
  private resolveVariableValue(
    node: ts.Node,
    propertyPath: Array<string> = []
  ): ANY {
    if (!this.shouldProcessProperty(propertyPath)) {
      return undefined;
    }

    if (ts.isIdentifier(node)) {
      return this.variables.get(node.getText());
    }

    if (ts.isPropertyAccessExpression(node)) {
      const baseValue = this.resolveVariableValue(
        node.expression,
        propertyPath
      );
      if (baseValue && typeof baseValue === 'object') {
        return baseValue[node.name.getText()];
      }
    }

    return undefined;
  }

  /**
   * Parses a given AST node to extract its value based on its type.
   *
   * This method handles different node types (e.g., object literals, arrays,
   * literals) and delegates to other methods for specific parsing logic.
   *
   * @param node - The AST node to parse.
   * @param propertyPath - An array of strings representing the path of the property.
   * @returns The parsed value or undefined if not processed.
   */
  private parseNode(node: ts.Node, propertyPath: Array<string> = []): ANY {
    if (!this.shouldProcessProperty(propertyPath)) {
      return undefined;
    }

    switch (node.kind) {
      case ts.SyntaxKind.ObjectLiteralExpression:
        return this.parseObjectLiteral(
          node as ts.ObjectLiteralExpression,
          propertyPath
        );
      case ts.SyntaxKind.ArrayLiteralExpression:
        return (node as ts.ArrayLiteralExpression).elements.map(
          (element, index) =>
            this.parseNode(element, [...propertyPath, index.toString()])
        );
      case ts.SyntaxKind.StringLiteral:
        return (node as ts.StringLiteral).text;
      case ts.SyntaxKind.NumericLiteral:
        return Number((node as ts.NumericLiteral).text);
      case ts.SyntaxKind.TrueKeyword:
        return true;
      case ts.SyntaxKind.FalseKeyword:
        return false;
      case ts.SyntaxKind.CallExpression:
        return node.getText();
      case ts.SyntaxKind.PropertyAccessExpression: {
        const resolved = this.resolveVariableValue(node, propertyPath);
        return resolved !== undefined ? resolved : node.getText();
      }
      case ts.SyntaxKind.Identifier: {
        const resolved = this.resolveVariableValue(node, propertyPath);
        return resolved !== undefined ? resolved : node.getText();
      }
      default:
        return node.getText();
    }
  }

  /**
   * Parses an object literal expression to extract its properties and values.
   *
   * This method iterates over the properties of the object literal and
   * processes each property based on its type and the current property path.
   *
   * @param node - The object literal expression to parse.
   * @param propertyPath - An array of strings representing the path of the property.
   * @returns A record of property names and their corresponding values.
   */
  private parseObjectLiteral(
    node: ts.ObjectLiteralExpression,
    propertyPath: Array<string> = []
  ): Record<string, ANY> {
    const result: Record<string, ANY> = {};

    for (const property of node.properties) {
      if (ts.isPropertyAssignment(property)) {
        const propName = property.name.getText();
        const newPath = [...propertyPath, propName];

        if (this.shouldProcessProperty(newPath)) {
          const value = this.parseNode(property.initializer, newPath);
          if (value !== undefined) {
            result[propName] = value;
          }
        }
      } else if (ts.isShorthandPropertyAssignment(property)) {
        const name = property.name.getText();
        const newPath = [...propertyPath, name];

        if (this.shouldProcessProperty(newPath)) {
          const value = this.resolveVariableValue(property.name, newPath);
          if (value !== undefined) {
            result[name] = value;
          } else {
            result[name] = property.name.getText();
          }
        }
      }
    }

    return result;
  }
}
