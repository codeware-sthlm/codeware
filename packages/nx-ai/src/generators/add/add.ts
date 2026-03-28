import {
  type GeneratorCallback,
  type Tree,
  formatFiles,
  readProjectConfiguration,
  runTasksInSerial,
  updateProjectConfiguration
} from '@nx/devkit';

import { initGeneratorInternal } from '../init/init';

import type { AddSchema } from './schema';

/**
 * Add the `@cdwr/nx-ai` plugin to a project by wiring up the analyze executor.
 */
export async function addGenerator(
  host: Tree,
  schema: AddSchema
): Promise<GeneratorCallback> {
  return addGeneratorInternal(host, schema);
}

/**
 * @internal
 * Defined as add factory function in `generators.json`
 */
export async function addGeneratorInternal(
  host: Tree,
  schema: AddSchema
): Promise<GeneratorCallback> {
  const tasks: Array<GeneratorCallback> = [];

  const targetName = schema.targetName ?? 'analyze';

  const project = readProjectConfiguration(host, schema.project);

  if (project.targets?.[targetName]) {
    throw new Error(
      `Target "${targetName}" already exists in project "${schema.project}". Use a different --targetName or remove the existing target first.`
    );
  }

  const installTask = await initGeneratorInternal(host, {
    skipFormat: true
  });
  tasks.push(installTask);

  updateProjectConfiguration(host, schema.project, {
    ...project,
    targets: {
      ...project.targets,
      [targetName]: {
        executor: '@cdwr/nx-ai:analyze'
      }
    }
  });

  if (!schema.skipFormat) {
    await formatFiles(host);
  }

  return runTasksInSerial(...tasks);
}
