import { readJsonFile, writeJsonFile } from '@nx/devkit';
import chalk from 'chalk';
import type { VersionData } from 'nx/src/command-line/release/version';
import type { PackageJson } from 'nx/src/utils/package-json';

/**
 * Workaround when Nx makes unwanted changes to package.json.
 *
 * Updates to nx-payload trigger updates to package.json
 * since the package is declared in devDependencies.
 *
 * These changes must be reverted:
 * - `version`
 * - `devDependencies['@cdwr/nx-payload']`
 *
 * @param originPackageFile `package.json` content before release
 * @param projectsVersionData Results from release version
 */
export const revertPackageJson = (
  originPackageFile: PackageJson,
  projectsVersionData: VersionData
) => {
  if (!projectsVersionData['nx-payload'].newVersion) {
    return;
  }
  if (
    !originPackageFile.devDependencies ||
    !originPackageFile.devDependencies['@cdwr/nx-payload']
  ) {
    return;
  }

  console.log(
    `${chalk.yellow(`⚠️ Nx auto-update workspace package.json when nx-payload has a new version.
  These changes will be reverted to make the update in another context.
  `)}`
  );

  const packageFile = readJsonFile<PackageJson>('package.json');

  if (packageFile.devDependencies) {
    packageFile.version = originPackageFile.version;
    packageFile.devDependencies['@cdwr/nx-payload'] =
      originPackageFile.devDependencies['@cdwr/nx-payload'];

    writeJsonFile('package.json', packageFile, { appendNewLine: true });
  }
};
