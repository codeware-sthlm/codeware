import {
  type GeneratorCallback,
  type Tree,
  formatFiles,
  readNxJson,
  runTasksInSerial
} from '@nx/devkit';

import { isPluginInferenceEnabled } from '../../utils/is-plugin-inference-enabled';
import { applicationGenerator } from '../application/application';

import { normalizeOptions } from './libs/normalize-options';
import type { PresetGeneratorSchema } from './schema';

/**
 * Payload application preset when a workspace is created with Nx CLI.
 *
 * Defined as factory function in `generators.json` and hence invoked by Nx CLI.
 */
export async function presetGenerator(
  host: Tree,
  schema: PresetGeneratorSchema
) {
  const tasks: Array<GeneratorCallback> = [];

  const nxJson = readNxJson(host);
  const options = normalizeOptions(host, schema);

  // Generate application
  const appGenTask = await applicationGenerator(host, {
    ...options,
    addPlugin: isPluginInferenceEnabled(nxJson),
    skipFormat: true
  });
  tasks.push(appGenTask);

  host.delete('libs');

  if (!options.skipFormat) {
    await formatFiles(host);
  }

  return runTasksInSerial(...tasks);
}
