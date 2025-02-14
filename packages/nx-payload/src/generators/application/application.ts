import {
  type GeneratorCallback,
  type Tree,
  formatFiles,
  runTasksInSerial
} from '@nx/devkit';
import { applicationGenerator as nextApplicationGenerator } from '@nx/next';

import { initGenerator as payloadInitGenerator } from '../init/init';

import { addPathAlias } from './libs/add-path-alias';
import { addProjectTargets } from './libs/add-project-targets';
import { createApplicationFiles } from './libs/create-application-files';
import { disableLegacyLinting } from './libs/disable-legacy-linting';
import { fixNextJsBuildOutput } from './libs/fix-nextjs-build-output';
import { normalizeOptions } from './libs/normalize-options';
import { updateEslintConfig } from './libs/update-eslint-config';
import type { AppGeneratorSchema } from './schema';

/**
 * Create a Payload application.
 */
export async function applicationGenerator(
  host: Tree,
  schema: AppGeneratorSchema
): Promise<GeneratorCallback> {
  return applicationGeneratorInternal(host, { addPlugin: false, ...schema });
}

/**
 * @internal
 * Defined as 'application' factory function in `generators.json`
 */
export async function applicationGeneratorInternal(
  host: Tree,
  schema: AppGeneratorSchema
): Promise<GeneratorCallback> {
  const tasks: Array<GeneratorCallback> = [];

  const options = normalizeOptions(host, schema);

  // Initialize Payload support
  const payloadTask = await payloadInitGenerator(host, {
    ...options,
    skipFormat: true
  });
  tasks.push(payloadTask);

  // Use Nx next plugin to scaffold a template application.
  // The generator will also setup inference for nextjs plugin
  // and the plugins itself depends on.
  const nextAppTask = await nextApplicationGenerator(host, {
    ...options,
    skipFormat: true
  });
  tasks.push(nextAppTask);

  // Create application files from template folder
  createApplicationFiles(host, options);

  // Application
  addProjectTargets(host, options);
  updateEslintConfig(host, options);

  // Problems with legacy apps that probably is Nx related,
  // but are minors since legacy apps are not recommended by this plugin
  disableLegacyLinting(host, options);
  fixNextJsBuildOutput(host, options);

  // Workspace
  addPathAlias(host, options);

  // Format files
  if (!options.skipFormat) {
    await formatFiles(host);
  }

  return runTasksInSerial(...tasks);
}
