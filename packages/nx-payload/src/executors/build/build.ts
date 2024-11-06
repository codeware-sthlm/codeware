import { type ExecutorContext, logger } from '@nx/devkit';
import tscExecutor from '@nx/js/src/executors/tsc/tsc.impl';

import { normalizeOptions } from './libs/normalize-options';
import type { BuildExecutorSchema } from './schema';

export async function buildExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext
) {
  const normalizedOptions = normalizeOptions(options, context);

  for await (const output of tscExecutor(normalizedOptions, context)) {
    if (!output.success) {
      logger.error('Could not compile application files');
      return {
        success: false
      };
    }
  }

  return {
    success: true
  };
}

export default buildExecutor;
