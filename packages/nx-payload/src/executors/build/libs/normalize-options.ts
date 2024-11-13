import { join } from 'path';

import type { ExecutorContext } from '@nx/devkit';
import invariant from 'tiny-invariant';

import type { BuildExecutorSchema } from '../schema';

export type NormalizedSchema = BuildExecutorSchema & {
  updateBuildableProjectDepsInPackageJson: boolean;
  buildableProjectDepsInPackageJsonType:
    | 'dependencies'
    | 'devDependencies'
    | 'none';
} & {
  projectRoot: string;
  sourceRoot: string;
};

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

  // Required target options
  const { clean, main, outputFileName, outputPath, tsConfig } = options;

  return {
    projectRoot,
    sourceRoot,
    outputPath,
    outputFileName,
    main,
    tsConfig,
    assets: options?.assets ?? [join(sourceRoot, 'assets')],
    clean: clean ?? true,
    watch: false,
    transformers: [],
    updateBuildableProjectDepsInPackageJson: true,
    buildableProjectDepsInPackageJsonType: 'dependencies'
  };
}
