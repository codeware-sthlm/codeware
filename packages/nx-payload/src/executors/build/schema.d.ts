import type { EsBuildExecutorOptions } from '@nx/esbuild/src/executors/esbuild/schema';

export type BuildExecutorSchema = EsBuildExecutorOptions & {
  /** Alias for deleteOutputPath */
  clean?: boolean;
};
