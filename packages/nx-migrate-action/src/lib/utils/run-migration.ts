import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { getPackageManagerCommand } from '@nx/devkit';
import { replaceInFile } from 'replace-in-file';

import type { MigrateConfig } from './types';
import { updateDependencies } from './update-dependencies';

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

  await replaceInFile({
    files: config.packagePatterns,
    // Match entire file contents in one go
    from: /[\s\S]*/g,
    to: (fileContent) => {
      const next = updateDependencies(fileContent, latestVersion);
      if (next !== fileContent) {
        core.debug('package.json versions were updated');
      } else {
        core.debug('no matching package specs found for update');
      }
      return next;
    },
    allowEmptyPaths: true
  });

  core.info('Migration completed');
};
