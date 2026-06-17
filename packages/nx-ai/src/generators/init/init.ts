import {
  type GeneratorCallback,
  type Tree,
  createProjectGraphAsync,
  formatFiles,
  readNxJson,
  runTasksInSerial
} from '@nx/devkit';
import { addPlugin } from '@nx/devkit/internal';

import { isPluginInferenceEnabled } from '../../utils/is-plugin-inference-enabled';

import { updateDependencies } from './libs/update-dependencies';
import type { InitSchema } from './schema';

/**
 * Initialize the `@cdwr/nx-ai` plugin.
 * Adds `@anthropic-ai/sdk` to the workspace dev dependencies.
 */
export async function initGenerator(
  host: Tree,
  schema: InitSchema
): Promise<GeneratorCallback> {
  return initGeneratorInternal(host, { addPlugin: false, ...schema });
}

/**
 * @internal
 * Defined as init factory function in `generators.json`
 */
export async function initGeneratorInternal(
  host: Tree,
  schema: InitSchema
): Promise<GeneratorCallback> {
  const tasks: Array<GeneratorCallback> = [];

  const nxJson = readNxJson(host);
  // Only use inference state if not explicitly set
  schema.addPlugin ??= isPluginInferenceEnabled(nxJson);

  const installTask = updateDependencies(host);
  tasks.push(installTask);

  if (schema.addPlugin) {
    const { createNodesV2 } = await import('../../plugins/plugin');

    await addPlugin(
      host,
      await createProjectGraphAsync(),
      '@cdwr/nx-ai/plugin',
      createNodesV2,
      {},
      false
    );
  }

  if (!schema.skipFormat) {
    await formatFiles(host);
  }

  return runTasksInSerial(...tasks);
}
