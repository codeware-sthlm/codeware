import * as core from '@actions/core';
import * as exec from '@actions/exec';

import { VersionInfo } from './types';

export async function getNxVersionInfo(): Promise<VersionInfo> {
  core.debug('Resolve nx versions');

  const output = await exec.getExecOutput('npm', [
    'list',
    '@nx/workspace',
    '--depth=0',
    '--json'
  ]);

  const currentVersion = JSON.parse(output.stdout).dependencies['@nx/workspace']
    .version;
  core.debug(`Current version: ${currentVersion}`);

  const currentMajor = parseInt(currentVersion.split('.')[0]);
  core.debug(`Current major: ${currentMajor}`);

  const latestOutput = await exec.getExecOutput('npm', [
    'view',
    '@nx/workspace',
    'version'
  ]);

  const latestVersion = latestOutput.stdout.trim();
  core.debug(`Latest version: ${latestVersion}`);

  const latestMajor = parseInt(latestVersion.split('.')[0]);
  core.debug(`Latest major: ${latestMajor}`);

  const isMajorUpdate = latestMajor > currentMajor;
  core.debug(`Major update: ${isMajorUpdate}`);

  const isOutdated = currentVersion !== latestVersion;
  core.debug(`Outdated: ${isOutdated}`);

  return {
    currentVersion,
    latestVersion,
    isMajorUpdate,
    isOutdated
  };
}
