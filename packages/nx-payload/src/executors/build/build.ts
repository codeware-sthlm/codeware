import { type ExecutorContext, logger, runExecutor } from '@nx/devkit';
import esbuildExecutor from '@nx/esbuild/src/executors/esbuild/esbuild.impl';

import { normalizeOptions } from './libs/normalize-options';
import type { BuildExecutorSchema } from './schema';

export type BuildResult = { success: boolean; outfile?: string };

/**
 * Builds the server and payload admin panel.
 *
 * Returns an iterator that needs to be itearated to get the build status.
 * Only one result is yielded, which is ether success or a failure as soon as it occurs.
 *
 * @param options - Build options
 * @param context - Executor context
 * @returns Build result
 *
 * @example
 * ```ts
 * const build = buildExecutor(options, context);
 * for await (const r of build) {
 *   if (r.success) {
 *     console.log('Build successful');
 *   } else {
 *     console.error('Build failed');
 *   }
 * }
 * ```
 */
export async function* buildExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext
): AsyncGenerator<BuildResult> {
  const normalizedOptions = normalizeOptions(options, context);
  // It's asserted in the normalize function
  const projectName = String(context.projectName);

  // Store esbuild result since it contains more than just the success flag
  let result = {} as BuildResult;

  // Build server first since it owns the `clean` option and will start with empty build folder
  const serverExecutor = esbuildExecutor(normalizedOptions, context);
  for await (const r of serverExecutor) {
    if (!r.success) {
      logger.error(`Failed to build server for project '${projectName}'`);
      yield r;
      return;
    }
    result = r;
  }

  // Build payload admin panel when folder structure is ready
  const payloadExecutor = await runExecutor(
    {
      target: 'payload',
      project: projectName
    },
    { command: 'npx payload build' },
    context
  );
  for await (const r of payloadExecutor) {
    if (!r.success) {
      logger.error(
        `Failed to build payload admin ui for project '${projectName}'`
      );
      yield r;
      return;
    }
  }

  logger.info(
    `Payload application built successfully for project '${projectName}'`
  );

  yield result;
}

export default buildExecutor;
