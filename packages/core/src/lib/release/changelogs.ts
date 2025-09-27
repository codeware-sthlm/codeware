import chalk from 'chalk';
import { releaseChangelog } from 'nx/release';
import type { NxReleaseVersionResult } from 'nx/src/command-line/release/version';

/**
 * Generate changelogs
 *
 * @param options Changelog options
 * @returns `true` if changelog ran successfully, otherwise `false`
 */
export const changelogs = async (options: {
  versionData: NxReleaseVersionResult['projectsVersionData'];
  dryRun?: boolean;
  verbose?: boolean;
}): Promise<boolean> => {
  const { versionData, dryRun, verbose } = options;

  console.log(`${chalk.magenta.underline('Generate changelogs')}`);

  try {
    await releaseChangelog({
      versionData,
      dryRun,
      verbose
    });
    return true;
  } catch (error) {
    console.error(
      `Generate changelogs: ${chalk.red((error as Error).message)}`
    );
    return false;
  }
};
