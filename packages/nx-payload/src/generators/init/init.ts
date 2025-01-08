import {
  type GeneratorCallback,
  type Tree,
  addDependenciesToPackageJson,
  convertNxGenerator,
  formatFiles,
  runTasksInSerial
} from '@nx/devkit';
import { initGenerator as nodeInitGenerator } from '@nx/node/src/generators/init/init';

import { payloadPluginsVersions, payloadVersion } from '../../utils/versions';

import type { InitSchema } from './schema';

function updateDependencies(tree: Tree) {
  return addDependenciesToPackageJson(
    tree,
    { ...payloadPluginsVersions, payload: payloadVersion, zod: 'latest' },
    {}
  );
}

/**
 * Add required application dependencies
 */
export async function initGenerator(
  tree: Tree,
  schema: InitSchema
): Promise<GeneratorCallback> {
  const tasks: GeneratorCallback[] = [];

  const nodeTask = await nodeInitGenerator(tree, schema);
  tasks.push(nodeTask);

  const installTask = updateDependencies(tree);
  tasks.push(installTask);

  await formatFiles(tree);

  return runTasksInSerial(...tasks);
}

export default initGenerator;
export const initSchematic = convertNxGenerator(initGenerator);
