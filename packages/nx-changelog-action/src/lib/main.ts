import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import * as core from '@actions/core';

import { nxChangelog } from './nx-changelog';
import { ActionInputsSchema } from './schemas/action-inputs.schema';

/**
 * Names of the apps that deployed. Accepts the deployment action's `deployed`
 * map (name → url) as well as a plain array.
 */
const parseReleased = (raw: string): Array<string> => {
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : Object.keys(parsed);
};

/**
 * Main action function
 */
export async function run(): Promise<void> {
  try {
    const inputs = ActionInputsSchema.parse({
      apps: JSON.parse(core.getInput('apps', { required: true })),
      released: parseReleased(core.getInput('released', { required: true })),
      createRelease: core.getBooleanInput('create-release'),
      token: core.getInput('token', { required: true })
    });

    core.debug(`Inputs:\n${JSON.stringify(inputs, null, 2)}`);

    // nx reads the token from the environment when creating remote releases
    process.env['GITHUB_TOKEN'] = inputs.token;

    const changelogs = await nxChangelog(inputs);

    const changelogsPath = join(
      process.env['RUNNER_TEMP'] || tmpdir(),
      'nx-changelogs.json'
    );
    writeFileSync(changelogsPath, JSON.stringify(changelogs));

    core.setOutput('changelogs', JSON.stringify(changelogs));
    core.setOutput('changelogs-path', changelogsPath);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}
