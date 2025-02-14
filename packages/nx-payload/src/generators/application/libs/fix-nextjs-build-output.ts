import {
  type TargetConfiguration,
  type Tree,
  readNxJson,
  readProjectConfiguration,
  updateProjectConfiguration
} from '@nx/devkit';

import { isPluginInferenceEnabled } from '../../../utils/is-plugin-inference-enabled';

import type { NormalizedSchema } from './normalize-options';

/**
 * Fix output path for Next.js build target to be in sync with the inferred build output path.
 *
 * When inference is disabled the Next.js plugin set build output to dist folder,
 * which is different from when inferred.
 *
 * @param host - The tree host
 * @param options - The normalized schema
 */
export function fixNextJsBuildOutput(
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

  const buildTarget = projectConfig.targets?.build as TargetConfiguration<{
    outputPath: string;
  }>;

  if (
    buildTarget?.executor === '@nx/next:build' &&
    buildTarget?.options?.outputPath?.match(/^dist/)
  ) {
    buildTarget.options.outputPath = buildTarget.options.outputPath.replace(
      /^dist\//,
      ''
    );
    projectConfig.targets = {
      ...(projectConfig.targets ?? {}),
      build: buildTarget
    };
  }

  updateProjectConfiguration(host, options.name, projectConfig);
}
