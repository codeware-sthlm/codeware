import { join } from 'path';

import { describe, expect, it } from 'vitest';

import { importSchemaFiles } from './import-schema-files';
import { type TestResult, runSchemaTests } from './run-schema-tests';

type CreateSchemaTestsOptions = {
  /**
   * Absolute path to the directory containing schemas
   */
  schemaDir: string;

  /**
   * Relative path to `schemaDir` containing fixture data.
   * Fixtures can be stored in subfolders and must be JSON files.
   *
   * @default `__fixtures__`
   */
  fixturesPath?: string;

  /**
   * Optional test suite description
   */
  description?: string;

  /**
   * Optional groups for result reporting
   */
  groups?: Array<{
    name: string;
    tags: string[];
  }>;

  /**
   * Whether to use snapshot testing for transformed data.
   *
   * Snapshot testing help you:
   *
   * - See the exact shape of your transformed data
   * - Catch unintended changes in transformation
   * - Have a reference for the expected structure
   *
   * @default `false`
   */
  snapshots?: boolean;
};

const logTestReport = (results: Array<TestResult>) => {
  console.table(
    results.map(({ schemaName, status, fixtureFile }) => ({
      Schema: schemaName,
      Fixture: fixtureFile,
      Status: status === 'success' ? '✅' : status === 'failure' ? '❌' : '⚠️'
    }))
  );
};

/**
 * Creates a test suite for validating schemas against fixture data.
 *
 * This function must be called within a test file.
 *
 * Prerequisites:
 * - schemas to be registered using `SchemaRegistry.register`
 * - fixture data to be stored in the `fixturesPath` directory
 *
 * @param options - The options for creating the test suite
 */
export const createSchemaTests = (options: CreateSchemaTestsOptions): void => {
  const {
    schemaDir,
    fixturesPath = '__fixtures__',
    description = 'Schema Validation',
    groups = [],
    snapshots = false
  } = options;

  describe(description, () => {
    it('validates all schemas against fixtures', async () => {
      await importSchemaFiles(schemaDir);

      const results = await runSchemaTests(join(schemaDir, fixturesPath));

      // If groups are specified, organize results by group
      if (groups.length > 0) {
        groups.forEach(({ name, tags }) => {
          const groupResults = results.filter((result) =>
            tags.some((tag) => result.metadata?.tags?.includes(tag))
          );

          if (groupResults.length > 0) {
            console.log(`\n${name} Schemas:`);
            logTestReport(groupResults);
          }
        });

        // Show ungrouped schemas if any
        const ungroupedResults = results.filter(
          (result) =>
            !groups.some(({ tags }) =>
              tags.some((tag) => result.metadata?.tags?.includes(tag))
            )
        );

        if (ungroupedResults.length > 0) {
          console.log('\nOther Schemas:');
          logTestReport(ungroupedResults);
        }
      } else if (results.length > 0) {
        // No groups, show all results together if any
        logTestReport(results);
      } else {
        // No results, show a message
        console.log('No schemas to validate');
      }

      // Show any validation failures
      results.forEach(({ schemaName, details, errors, status }, index) => {
        if (status === 'success') {
          return;
        }

        console.log(
          `\n${status === 'skipped' ? '⚠️ ' : '🔴 '} [${index}] Schema validation ${status}: ${schemaName}`
        );
        if (details) {
          console.log('   Details:', details);
        }
        if (errors) {
          console.log('   Errors:', errors);
        }
      });

      // Single assertion for all schemas
      results.forEach((result) => {
        if (result.status === 'success' && snapshots) {
          expect(result.transformed).toMatchSnapshot(
            `${result.schemaName} transformed shape`
          );
        }
        expect(
          result.status !== 'failure',
          `Schema ${result.schemaName} validation failed`
        ).toBe(true);
      });
    });
  });
};
