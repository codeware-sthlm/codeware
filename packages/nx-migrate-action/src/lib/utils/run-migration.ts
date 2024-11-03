import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { getPackageManagerCommand } from '@nx/devkit';
import { replaceInFile } from 'replace-in-file';

import type { MigrateConfig } from './types';

export const runMigration = async (
  config: MigrateConfig,
  latestVersion: string
) => {
  const pmc = getPackageManagerCommand();

  core.info('Running Nx migrate');
  await exec.exec(pmc.exec, ['nx', 'migrate', latestVersion]);

  core.info('Adding create-nx-workspace dependency');
  await exec.exec(pmc.exec, [
    'nx',
    'add',
    `create-nx-workspace@${latestVersion}`
  ]);

  core.info('Installing dependencies');
  await exec.exec(pmc.install);

  // Check for and run migrations
  const migrationsExist =
    (await exec.exec('test', ['-f', 'migrations.json'], {
      ignoreReturnCode: true
    })) === 0;

  if (migrationsExist) {
    core.info('Running migrations');
    await exec.exec(pmc.exec, ['nx', 'migrate', '--run-migrations']);
  } else {
    core.info('No migrations found');
  }

  core.info('Update version references in package.json files');

  core.debug('Find and update semantic versions');

  await replaceInFile({
    files: config.packagePatterns,
    from: /"(?:create-nx-workspace|nx|@nx\/[^"]*)": "\d+\.\d+\.\d+"/g,
    to: (match) => {
      const packageName = match.split(':')[0];
      const newValue = `${packageName}: "${latestVersion}"`;

      core.debug(`Found semver version '${match}' -> '${newValue}'`);

      return newValue;
    },
    allowEmptyPaths: true
  });

  core.debug('Find and update major versions');

  await replaceInFile({
    files: config.packagePatterns,
    from: /"(?:create-nx-workspace|nx|@nx\/[^"]*)": "(\d+)\.x"/g,
    to: (match) => {
      const packageName = match.split(':')[0];
      const major = latestVersion.split('.')[0];
      const newValue = `${packageName}: "${major}.x"`;

      core.debug(`Found dynamic version '${match}' -> '${newValue}'`);

      return newValue;
    },
    allowEmptyPaths: true
  });

  core.info('Migration completed');
};
