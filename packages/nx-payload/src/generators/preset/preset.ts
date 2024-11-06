import {
  type GeneratorCallback,
  type Tree,
  formatFiles,
  runTasksInSerial
} from '@nx/devkit';

import applicationGenerator from '../application/application';

import { normalizeOptions } from './libs/normalize-options';
import { type PresetGeneratorSchema } from './schema';

export async function presetGenerator(
  tree: Tree,
  _options: PresetGeneratorSchema
) {
  const tasks: GeneratorCallback[] = [];

  const options = normalizeOptions(tree, _options);

  // Generate application
  const appGenTask = await applicationGenerator(tree, options);
  tasks.push(appGenTask);

  tree.delete('libs');

  await formatFiles(tree);

  return runTasksInSerial(...tasks);
}

export default presetGenerator;
