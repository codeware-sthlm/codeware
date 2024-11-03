import * as core from '@actions/core';
import * as exec from '@actions/exec';

import { VersionInfo } from './types';

export async function getNxVersionInfo(): Promise<VersionInfo> {
  core.info('Resolve nx versions');

  const output = await exec.getExecOutput(
    'npm',
    ['list', '@nx/workspace', '--depth=0', '--json'],
    { silent: true }
  );

  const currentVersion = JSON.parse(output.stdout).dependencies['@nx/workspace']
    .version;
  core.info(`Current version: ${currentVersion}`);

  const currentMajor = parseInt(currentVersion.split('.')[0]);
  core.info(`Current major: ${currentMajor}`);

  const latestOutput = await exec.getExecOutput(
    'npm',
    ['view', '@nx/workspace', 'version'],
    { silent: true }
  );

  const latestVersion = latestOutput.stdout.trim();
  core.info(`Latest version: ${latestVersion}`);

  const latestMajor = parseInt(latestVersion.split('.')[0]);
  core.info(`Latest major: ${latestMajor}`);

  const isMajorUpdate = latestMajor > currentMajor;
  core.info(`Major update: ${isMajorUpdate}`);

  const isOutdated = currentVersion !== latestVersion;
  core.info(`Outdated: ${isOutdated}`);

  return {
    currentVersion,
    latestVersion,
    isMajorUpdate,
    isOutdated
  };
}
