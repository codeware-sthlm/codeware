import {
  type GeneratorCallback,
  type Tree,
  addDependenciesToPackageJson,
  convertNxGenerator,
  formatFiles,
  runTasksInSerial
} from '@nx/devkit';
import { initGenerator as expressInitGenerator } from '@nx/express/src/generators/init/init';

import { payloadPluginsVersions, payloadVersion } from '../../utils/versions';

import type { Schema } from './schema';

function updateDependencies(tree: Tree) {
  return addDependenciesToPackageJson(
    tree,
    { ...payloadPluginsVersions, payload: payloadVersion },
    {}
  );
}

/**
 * Add required application dependencies
 */
export async function initGenerator(
  tree: Tree,
  schema: Schema
): Promise<GeneratorCallback> {
  const tasks: GeneratorCallback[] = [];

  const expressTask = await expressInitGenerator(tree, schema);
  tasks.push(expressTask);

  const installTask = updateDependencies(tree);
  tasks.push(installTask);

  await formatFiles(tree);

  return runTasksInSerial(...tasks);
}

export default initGenerator;
export const initSchematic = convertNxGenerator(initGenerator);
