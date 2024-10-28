import * as core from '@actions/core';
import { replaceInFile } from 'replace-in-file';

/**
 * Update semantic versions
 */
export async function updatePackageVersions(
  latestVersion: string,
  patterns: string[]
): Promise<void> {
  core.debug('Find and update semantic versions');

  await replaceInFile({
    files: patterns,
    from: /"(?:create-nx-workspace|nx|@nx\/[^"]*)": "\d+\.\d+\.\d+"/g,
    to: (match) => {
      // const [packageName] = match.match(
      //   /"(?:create-nx-workspace|nx|@nx\/[^"]*)"/
      // );
      const packageName = match.split(':')[0];
      const newValue = `${packageName}: "${latestVersion}"`;

      core.debug(`Found semver version '${match}' -> '${newValue}'`);

      return newValue;
    }
  });

  core.debug('Find and update major versions');

  await replaceInFile({
    files: patterns,
    from: /"(?:create-nx-workspace|nx|@nx\/[^"]*)": "(\d+)\.x"/g,
    to: (match) => {
      // const [packageName] = match.match(
      //   /"(?:create-nx-workspace|nx|@nx\/[^"]*)"/
      // );
      const packageName = match.split(':')[0];
      const major = latestVersion.split('.')[0];
      const newValue = `${packageName}: "${major}.x"`;

      core.debug(`Found dynamic version '${match}' -> '${newValue}'`);

      return newValue;
    }
  });
}
