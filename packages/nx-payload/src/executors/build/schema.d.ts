import type { ExecutorOptions } from '@nx/js/src/utils/schema';
import type { WebpackExecutorOptions } from '@nx/webpack';

export type BuildExecutorSchema = ExecutorOptions &
  /**
   * Relative path to the compiled main file from project root.
   * Required for `serve` to find this file properly.
   */
  Required<Pick<WebpackExecutorOptions, 'outputFileName'>>;
