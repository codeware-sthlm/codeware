import * as core from '@actions/core';
import { printGitHubContext } from '@codeware/core/actions';
import { Fly } from '@codeware/fly-node';

import type { ActionInputs } from './schemas/action-inputs.schema';
import {
  type ActionOutputs,
  ActionOutputsSchema
} from './schemas/action-outputs.schema';
import { runDestroyApps } from './utils/run-destroy-apps';

/**
 * Run fly destroy process for deprecated preview applications.
 *
 * @param inputs Destroy options
 */
export async function flyDestroy(inputs: ActionInputs): Promise<ActionOutputs> {
  core.info('Starting fly destroy process');

  core.startGroup('GitHub context details');
  printGitHubContext();
  core.endGroup();

  core.startGroup('Initialize Fly client');
  const fly = new Fly({
    token: inputs.flyApiToken || process.env['FLY_API_TOKEN'] || '',
    logger: {
      info: (msg) => core.info(msg),
      error: (msg, params) => core.error(msg, params),
      traceCLI: inputs.flyTraceCli ?? false,
      streamToConsole: inputs.flyConsoleLogs ?? false
    }
  });

  await fly.isReady('assert');
  core.info('Fly client is ready 🚀');
  core.endGroup();

  core.startGroup('Destroy deprecated applications');
  const { destroyed, skipped } = await runDestroyApps(inputs.token, fly);
  core.endGroup();

  return ActionOutputsSchema.parse({ destroyed, skipped });
}
