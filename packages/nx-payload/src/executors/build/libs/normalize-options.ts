import { join } from 'path';

import type { ExecutorContext } from '@nx/devkit';
import invariant from 'tiny-invariant';

import type { BuildExecutorSchema, NormalizedSchema } from '../schema';

// export type NormalizedTscSchema = TscExecutorSchema & {
//   updateBuildableProjectDepsInPackageJson: boolean;
//   buildableProjectDepsInPackageJsonType:
//     | 'dependencies'
//     | 'devDependencies'
//     | 'none';
// } & {
//   projectRoot: string;
//   sourceRoot: string;
// };

// export type NormalizedEsBuildSchema = EsBuildExecutorSchema & {
//   projectRoot: string;
//   sourceRoot: string;
// };

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

  // Default to tsc if executor is not provided
  options.executor ||= 'tsc';

  if (options.executor === 'tsc') {
    return {
      executor: 'tsc',
      projectRoot,
      sourceRoot,
      outputPath: options.outputPath,
      outputFileName: options.outputFileName,
      main: options.main,
      tsConfig: options.tsConfig,
      assets: options?.assets ?? [join(sourceRoot, 'assets')],
      clean: options?.clean ?? true,
      watch: false,
      transformers: [],
      updateBuildableProjectDepsInPackageJson: true,
      buildableProjectDepsInPackageJsonType: 'dependencies'
    };
  }

  return {
    ...options,
    projectRoot,
    sourceRoot,
    // Nx schema default values
    additionalEntryPoints: options?.additionalEntryPoints ?? [],
    bundle: options?.bundle ?? true,
    deleteOutputPath: options?.deleteOutputPath ?? true,
    format: options?.format ?? ['esm'],
    metafile: options?.metafile ?? false,
    minify: options?.minify ?? false,
    outputHashing: options?.outputHashing ?? 'none',
    platform: options?.platform ?? 'node',
    skipTypeCheck: options?.skipTypeCheck ?? false,
    target: options?.target ?? 'esnext',
    watch: options?.watch ?? false,
    // Payload schema default values
    assets: options?.assets ?? [join(sourceRoot, 'assets')]
  };
}

// function normalizeTscOptions(
//   options: TscExecutorSchema,
//   projectRoot: string,
//   sourceRoot: string
// ): NormalizedTscSchema {
//   // Required target options
//   const { clean, main, outputFileName, outputPath, tsConfig } = options;

//   return {
//     projectRoot,
//     sourceRoot,
//     outputPath,
//     outputFileName,
//     main,
//     tsConfig,
//     assets: options?.assets ?? [join(sourceRoot, 'assets')],
//     clean: clean ?? true,
//     watch: false,
//     transformers: [],
//     updateBuildableProjectDepsInPackageJson: true,
//     buildableProjectDepsInPackageJsonType: 'dependencies'
//   };
// }

// function normalizeEsBuildOptions(
//   options: EsBuildExecutorSchema,
//   projectRoot: string,
//   sourceRoot: string
// ): NormalizedEsBuildSchema {
//   // Required target options
//   const { main, outputFileName, outputPath, tsConfig } = options;

//   return {
//     ...options,
//     projectRoot,
//     sourceRoot,
//     outputPath,
//     outputFileName,
//     main,
//     tsConfig,
//     assets: options?.assets ?? [join(sourceRoot, 'assets')]
//   };
// }
