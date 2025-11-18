import { Tree, names, readNxJson } from '@nx/devkit';

import { isPluginInferenceEnabled } from '../../../utils/is-plugin-inference-enabled';
import type { AppGeneratorSchema } from '../schema';

export type NormalizedSchema = AppGeneratorSchema &
  // Pick opinionated options for this generator
  Required<
    Pick<
      AppGeneratorSchema,
      | 'appDir'
      | 'database'
      | 'e2eTestRunner'
      | 'linter'
      | 'skipFormat'
      | 'src'
      | 'style'
      | 'swc'
      | 'tags'
      | 'unitTestRunner'
    >
  >;

export function normalizeOptions(
  host: Tree,
  options: AppGeneratorSchema
): NormalizedSchema {
  const nxJson = readNxJson(host);

  return {
    // Required
    name: names(options.name).fileName,
    directory: options.directory,

    // Required defaults (by design) for this plugin,
    // but the user is free to override them when needed
    appDir: options.appDir ?? true,
    src: options.src ?? true,

    // Opinionated defaults
    database: options.database || 'mongodb',
    e2eTestRunner: options.e2eTestRunner || 'none',
    linter: options.linter || 'eslint',
    skipFormat: options.skipFormat ?? false,
    style: options.style || 'scss',
    swc: options.swc ?? true,
    tags: options.tags || '',
    unitTestRunner: options.unitTestRunner || 'jest',

    // Internal options
    addPlugin: options.addPlugin ?? isPluginInferenceEnabled(nxJson)
  };
}
