import { join } from 'path';

import { type ExecutorContext, logger } from '@nx/devkit';
import tscExecutor from '@nx/js/src/executors/tsc/tsc.impl';
import runCommandsImpl from 'nx/src/executors/run-commands/run-commands.impl';

import { normalizeOptions } from './libs/normalize-options';
import type { BuildExecutorSchema } from './schema';

export async function buildExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext
) {
  const normalizedOptions = normalizeOptions(options, context);

  // Build express application first since it owns the `clean` option
  for await (const appBuild of tscExecutor(normalizedOptions, context)) {
    if (!appBuild.success) {
      logger.error('Could not compile express application');
      return {
        success: false
      };
    }
  }

  logger.info('Express application compiled successfully');

  // Build payload admin panel when folder structure is ready
  const payloadBuild = await runCommandsImpl(
    {
      commands: ['npx payload build'],
      parallel: false,
      env: {
        PAYLOAD_CONFIG_PATH: join(
          normalizedOptions.sourceRoot,
          'payload.config.ts'
        )
      },
      __unparsed__: []
    },
    context
  );
  if (!payloadBuild.success) {
    logger.error('Could not compile payload admin panel');
    logger.error(payloadBuild.terminalOutput);
    return {
      success: false
    };
  }

  logger.info('Payload admin panel compiled successfully');

  return {
    success: true
  };
}

export default buildExecutor;
