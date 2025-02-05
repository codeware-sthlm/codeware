import {
  type GeneratorCallback,
  type Tree,
  convertNxGenerator,
  formatFiles,
  runTasksInSerial
} from '@nx/devkit';

import initGenerator from '../init/init';

import { createApplicationFiles } from './libs/create-application-files';
import { createDockerfile } from './libs/create-dockerfile';
import { createNodeApplication } from './libs/create-node-application';
import { createPayloadConfig } from './libs/create-payload-config';
import { fixTestTarget } from './libs/fix-test-target';
import { normalizeOptions } from './libs/normalize-options';
import { updateProjectConfig } from './libs/update-project-config';
import { updateTsConfigApp } from './libs/update-tsconfig-app';
import { updateWorkspaceConfig } from './libs/update-workspace-config';
import type { AppGeneratorSchema } from './schema';

export async function applicationGenerator(
  host: Tree,
  schema: AppGeneratorSchema
): Promise<GeneratorCallback> {
  const options = normalizeOptions(schema);

  // Initialize for Payload support
  const payloadTask = await initGenerator(host, schema);

  // Use Nx node plugin to scaffold a template application
  const nodeAppTask = await createNodeApplication(host, options);

  // Fix the test target
  fixTestTarget(host, options);

  // Create application files from template folder
  createApplicationFiles(host, options);

  // Create other application files dynamically
  createDockerfile(host, options);
  createPayloadConfig(host, options);

  // Application config files
  updateProjectConfig(host, options);
  updateTsConfigApp(host, options);

  // Workspace root config files
  updateWorkspaceConfig(host, options);

  // Format files
  if (!options.skipFormat) {
    await formatFiles(host);
  }

  return runTasksInSerial(payloadTask, nodeAppTask);
}

export default applicationGenerator;
export const applicationSchematic = convertNxGenerator(applicationGenerator);
