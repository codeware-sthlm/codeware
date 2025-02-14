import {
  type GeneratorCallback,
  type Tree,
  createProjectGraphAsync,
  formatFiles,
  readNxJson,
  runTasksInSerial
} from '@nx/devkit';
import { addPlugin } from '@nx/devkit/src/utils/add-plugin';

import type { PayloadTarget } from '../../utils/definitions';
import { isPluginInferenceEnabled } from '../../utils/is-plugin-inference-enabled';

import { updateDependencies } from './libs/update-dependencies';
import type { InitSchema } from './schema';

/**
 * Install Payload dependencies.
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

  // Install NextJS dependencies and add plugin when inference is enabled

  // Install Payload dependencies
  const installTask = updateDependencies(host);
  tasks.push(installTask);

  if (schema.addPlugin) {
    const { createNodesV2 } = await import('../../plugins/plugin');

    await addPlugin(
      host,
      await createProjectGraphAsync(),
      '@cdwr/nx-payload/plugin',
      createNodesV2,
      {
        generateTargetName: ['gen' satisfies PayloadTarget],
        payloadTargetName: ['payload' satisfies PayloadTarget],
        payloadGraphqlTargetName: ['payload-graphql' satisfies PayloadTarget],
        dxMongodbTargetName: ['dx:mongodb' satisfies PayloadTarget],
        dxPostgresTargetName: ['dx:postgres' satisfies PayloadTarget],
        dxStartTargetName: ['dx:start' satisfies PayloadTarget],
        dxStopTargetName: ['dx:stop' satisfies PayloadTarget]
      },
      false
    );
  }

  if (!schema.skipFormat) {
    await formatFiles(host);
  }

  return runTasksInSerial(...tasks);
}
