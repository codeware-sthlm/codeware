import * as core from '@actions/core';
import {
  type AppChangelogRange,
  generateAppChangelogs
} from '@codeware/shared/util/nx-deploy';

import type { ActionInputs } from './schemas/action-inputs.schema';

/**
 * Render the changelog for each app that deployed.
 *
 * @param inputs Action inputs
 * @returns Map of app name to rendered markdown
 */
export async function nxChangelog(
  inputs: ActionInputs
): Promise<Record<string, string>> {
  const { apps, released, createRelease } = inputs;

  const releases = new Map<string, AppChangelogRange>();

  for (const app of apps) {
    if (!released.includes(app.name)) {
      core.info(`Skip: ${app.name} - did not deploy`);
      continue;
    }
    if (app.version === app.previousVersion) {
      // A forced redeploy of an unbumped app ships nothing new
      core.info(`Skip: ${app.name} - redeployed at ${app.version}`);
      continue;
    }
    core.info(`Changelog: ${app.name} ${app.previousVersion} → ${app.version}`);
    releases.set(app.name, {
      version: app.version,
      previousVersion: app.previousVersion
    });
  }

  if (releases.size === 0) {
    core.info('No apps to generate a changelog for');
    return {};
  }

  core.startGroup(
    createRelease
      ? 'Create GitHub releases'
      : 'Render changelogs (no release created)'
  );
  const changelogs = await generateAppChangelogs({ releases, createRelease });
  core.endGroup();

  for (const name of releases.keys()) {
    if (!changelogs.has(name)) {
      core.info(`${name}: changelog range produced no entries`);
    }
  }

  return Object.fromEntries(changelogs);
}
