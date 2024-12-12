import type { EsBuildExecutorOptions } from '@nx/esbuild/src/executors/esbuild/schema';
import type { ExecutorOptions as TscExecutorOptions } from '@nx/js/src/utils/schema';
import type { WebpackExecutorOptions } from '@nx/webpack';

// export type TscExecutorSchema = ExecutorOptions &
//   /**
//    * Relative path to the compiled main file from project root.
//    * Required for `serve` to find this file properly.
//    */
//   Required<Pick<WebpackExecutorOptions, 'outputFileName'>>;

// export type EsBuildExecutorSchema = EsBuildExecutorOptions &
//   Required<Pick<WebpackExecutorOptions, 'outputFileName'>>;

export type BuildExecutorSchema =
  | ({ executor: 'tsc' } & TscExecutorOptions &
      Required<Pick<WebpackExecutorOptions, 'outputFileName'>>)
  | ({ executor: 'esbuild' } & EsBuildExecutorOptions);

export type NormalizedSchema = {
  projectRoot: string;
  sourceRoot: string;
} & (
  | ({ executor: 'tsc' } & TscExecutorOptions &
      Required<Pick<WebpackExecutorOptions, 'outputFileName'>> & {
        updateBuildableProjectDepsInPackageJson: boolean;
        buildableProjectDepsInPackageJsonType:
          | 'dependencies'
          | 'devDependencies'
          | 'none';
      })
  | ({ executor: 'esbuild' } & EsBuildExecutorOptions)
);
