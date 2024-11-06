import type { ExecutorContext } from '@nx/devkit';
import invariant from 'tiny-invariant';

import type { PayloadCliExecutorSchema } from '../schema';

export type NormalizedSchema = PayloadCliExecutorSchema & {
  projectRoot: string;
  sourceRoot: string;
};

export function normalizeOptions(
  options: PayloadCliExecutorSchema,
  context: ExecutorContext
): NormalizedSchema {
  const { projectName } = context;
  invariant(projectName, 'No project name provided to executor');

  const configuration = context?.projectsConfigurations?.projects[projectName];
  invariant(configuration, 'No configuration provided for project');

  const { root: projectRoot, sourceRoot } = configuration;
  invariant(projectRoot, 'No root provided for project');
  invariant(sourceRoot, 'No sourceRoot provided for project');

  return {
    projectRoot,
    sourceRoot
  };
}
