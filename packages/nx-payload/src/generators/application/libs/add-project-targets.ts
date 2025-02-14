import {
  type Tree,
  readNxJson,
  readProjectConfiguration,
  updateProjectConfiguration
} from '@nx/devkit';

import { createPayloadTargets } from '../../../utils/create-payload-targets';
import { isPluginInferenceEnabled } from '../../../utils/is-plugin-inference-enabled';

import type { NormalizedSchema } from './normalize-options';

/**
 * Updates the project configuration with Payload targets
 * when plugin inference is disabled.
 *
 * @param host - The tree host
 * @param options - The normalized schema
 */
export function addProjectTargets(host: Tree, options: NormalizedSchema): void {
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

  const payloadTargets = createPayloadTargets({
    projectName: options.name,
    projectRoot: options.directory,
    // graphQL is disabled by design in `payload.config.ts` template
    isGraphQLDisabled: true
  });

  // Apply payload targets to project config
  updateProjectConfiguration(host, options.name, {
    ...projectConfig,
    targets: {
      ...(projectConfig.targets ?? {}),
      ...payloadTargets
    }
  });
}
