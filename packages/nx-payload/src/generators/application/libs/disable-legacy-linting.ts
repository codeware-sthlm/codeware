import {
  type Tree,
  readNxJson,
  readProjectConfiguration,
  updateProjectConfiguration
} from '@nx/devkit';

import { isPluginInferenceEnabled } from '../../../utils/is-plugin-inference-enabled';

import type { NormalizedSchema } from './normalize-options';

/**
 * Linting for legacy apps does not work as expected due to lack of ESM support.
 * Instead of applying a flaky workaround, we disable linting for legacy apps.
 *
 * It's better to let the developer decide how to handle linting.
 *
 * @param host - The tree host
 * @param options - The normalized schema
 */
export function disableLegacyLinting(
  host: Tree,
  options: NormalizedSchema
): void {
  const nxJson = readNxJson(host);
  if (!nxJson) {
    throw new Error('Could not read nx.json');
  }

  // If plugin inference is enabled, we don't need to update the project config
  if (isPluginInferenceEnabled(nxJson)) {
    return;
  }

  const projectConfig = readProjectConfiguration(host, options.name);
  if (!projectConfig) {
    throw new Error('Could not read project.json');
  }

  if (projectConfig.targets?.lint) {
    projectConfig.targets.lint = {
      metadata: {
        description:
          'Linting for legacy apps must be setup manually or migrate to the eslint plugin.'
      },
      executor: 'nx:noop'
    };
    updateProjectConfiguration(host, options.name, projectConfig);
  }
}
