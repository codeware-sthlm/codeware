import { names } from '@nx/devkit';

import type { AppGeneratorSchema } from '../schema';

export type NormalizedSchema = AppGeneratorSchema &
  // Pick opinionated options for this generator
  Required<
    Pick<
      AppGeneratorSchema,
      | 'bundler'
      | 'database'
      | 'docker'
      | 'e2eTestRunner'
      | 'framework'
      | 'linter'
      | 'skipFormat'
      | 'tags'
      | 'unitTestRunner'
    >
  >;

export function normalizeOptions(
  options: AppGeneratorSchema
): NormalizedSchema {
  return {
    // Required
    name: names(options.name).fileName,
    directory: options.directory,
    // Opinionated
    bundler: options.bundler || 'esbuild',
    database: options.database || 'mongodb',
    docker: false,
    e2eTestRunner: options.e2eTestRunner || 'none',
    framework: options.framework || 'none',
    linter: options.linter || 'eslint',
    skipFormat: options.skipFormat || false,
    tags: options.tags || '',
    unitTestRunner: options.unitTestRunner || 'jest'
  };
}
