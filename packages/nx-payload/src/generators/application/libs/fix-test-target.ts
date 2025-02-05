import {
  type Tree,
  readNxJson,
  readProjectConfiguration,
  updateProjectConfiguration
} from '@nx/devkit';

import { isPluginInferenceEnabled } from './is-plugin-inference-enabled';
import type { NormalizedSchema } from './normalize-options';

/**
 * This function fixes the test target that is broken by the `@nx/node:app` generator.
 *
 * The test target can not be invoked since the executor is missing.
 * Jest also require `jestConfig` option to be present.
 *
 * ```json
 * "test": {
 *   "options": {
 *     "passWithNoTests": true
 *   }
 * }
 * ```
 * When Just plugin is defined and inference is enabled, the test target is removed.
 *
 * Otherwise apply the executor and required options.
 */
export function fixTestTarget(host: Tree, options: NormalizedSchema) {
  const projectConfig = readProjectConfiguration(host, options.name);
  if (!projectConfig) {
    throw new Error('Could not read project.json');
  }

  let testTarget = projectConfig.targets?.test;

  // Executor must be present on explicit targets to run
  if (testTarget && !testTarget.executor && testTarget.options) {
    const nxJson = readNxJson(host);
    if (!nxJson) {
      throw new Error('Could not read nx.json');
    }

    const hasJestPlugin = (nxJson.plugins ?? [])
      .map((p) => (typeof p === 'string' ? p : p.plugin))
      .includes('@nx/jest/plugin');
    const inference = isPluginInferenceEnabled(nxJson);

    if (hasJestPlugin && inference) {
      testTarget = undefined;
    } else {
      // Fixit
      testTarget = {
        ...testTarget,
        executor: '@nx/jest:jest',
        options: {
          ...testTarget.options,
          jestConfig: '{projectRoot}/jest.config.ts'
        },
        outputs: testTarget?.outputs ?? [
          '{workspaceRoot}/coverage/{projectRoot}'
        ]
      };
    }

    projectConfig.targets = {
      ...projectConfig.targets,
      ...(testTarget ? { test: testTarget } : {})
    };

    updateProjectConfiguration(host, options.name, projectConfig);
  }
}
