import type { ExecutorContext } from '@nx/devkit';
import invariant from 'tiny-invariant';

import type { BuildExecutorSchema } from '../schema';

export type NormalizedSchema = {
  projectRoot: string;
  sourceRoot: string;
} & BuildExecutorSchema;

export function normalizeOptions(
  options: BuildExecutorSchema,
  context: ExecutorContext
): NormalizedSchema {
  const { projectName } = context;
  invariant(projectName, 'No project name provided to build executor');

  const configuration = context?.projectsConfigurations?.projects[projectName];
  invariant(configuration, 'No configuration provided for project');

  const { root: projectRoot, sourceRoot } = configuration;
  invariant(projectRoot, 'No root provided for project');
  invariant(sourceRoot, 'No sourceRoot provided for project');

  return {
    projectRoot,
    sourceRoot,
    // Support custom overrides
    ...options
  };
}
