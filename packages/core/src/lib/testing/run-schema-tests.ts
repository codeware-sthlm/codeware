import { readFile } from 'fs/promises';
import { join } from 'path';

import fg from 'fast-glob';

import { type SchemaMetadata, SchemaRegistry } from './schema-registry.class';
import { type ValidationResult, validateSchema } from './validate-schema';

export type TestResult = {
  schemaName: string;
  status: 'success' | 'failure' | 'skipped';
  details?: string;
  fixtureFile: string;
  fixtureKey: string;
  transformed?: unknown;
  metadata: Omit<SchemaMetadata, 'schema'> | undefined;
  errors: ValidationResult['errors'] | null;
};

/**
 * @internal
 * Runs schema tests for all fixtures in the given directory.
 *
 * It's recommended to use `createSchemaTests` to run the test cases
 * and output a detailed test report.
 *
 * @param fixtureDir - Absolute path to the directory containing the fixture files
 * @returns An array of test results
 */
export async function runSchemaTests(
  fixtureDir: string
): Promise<TestResult[]> {
  // Look for JSON files in directories
  const fixtures = await fg([`**/*.json`], {
    cwd: fixtureDir,
    absolute: true
  });

  const results: TestResult[] = [];

  for (const fullPixturePath of fixtures) {
    try {
      const fixtureFile = fullPixturePath.replace(join(fixtureDir, '/'), '');
      const fixtureKey = fixtureFile.replace('.json', '');
      const metadata = SchemaRegistry.get(fixtureKey);

      if (!metadata) {
        results.push({
          schemaName: `Unknown Schema (${fixtureKey})`,
          status: 'failure',
          details: `No schema registered for fixture: ${fixtureKey}`,
          fixtureFile,
          fixtureKey,
          metadata: undefined,
          errors: null
        });
        continue;
      }

      const fixtureData = JSON.parse(await readFile(fullPixturePath, 'utf-8'));

      const validationResult = validateSchema(metadata.schema, fixtureData, {
        name: metadata.name
      });

      results.push({
        schemaName: metadata.name,
        status: validationResult.success ? 'success' : 'failure',
        details: validationResult.details,
        fixtureFile,
        fixtureKey,
        transformed: validationResult.parsed,
        metadata,
        errors: validationResult.errors
      });
    } catch (error) {
      results.push({
        schemaName: fullPixturePath,
        status: 'failure',
        details: `Failed to process fixture: ${error}`,
        fixtureFile: '',
        fixtureKey: '',
        metadata: undefined,
        errors: null
      });
    }
  }

  // Check for registered schemas that were not tested
  for (const [fixtureKey, metadata] of SchemaRegistry.getAll()) {
    if (!results.some((result) => result.schemaName === metadata.name)) {
      results.push({
        schemaName: metadata.name,
        status: 'skipped',
        details: `No fixture found for schema: ${metadata.name}`,
        fixtureFile: '',
        fixtureKey,
        metadata,
        errors: null
      });
    }
  }

  return results.sort((a, b) => a.schemaName.localeCompare(b.schemaName));
}
