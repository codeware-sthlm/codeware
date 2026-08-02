import { releaseVersion } from 'nx/release';

export type AppRelease = {
  /** Version to stamp — the resolved bump, or the last released version */
  version: string;
  /**
   * Version the app was last released as. The changelog range starts here, and
   * it cannot be recovered later — once the new tag is pushed it becomes the
   * one nx resolves.
   */
  previousVersion: string;
  /** Whether conventional commits produced a bump for this app */
  bumped: boolean;
};

/**
 * Resolve the release state of every app in the `apps` release group.
 *
 * Runs `nx release version` in dry-run mode, so nothing is written or tagged —
 * only the version each app *would* be bumped to is resolved.
 *
 * The baseline is the app's last release tag, which is only pushed once a
 * deployment succeeds. A failed deploy therefore leaves the baseline behind and
 * the same bump is resolved again on the next run.
 *
 * Apps with no bump are still reported, carrying their last released version.
 * They are not deployed on their own, but a manual dispatch can still target
 * one and needs a version to stamp.
 *
 * @param preid - Prerelease identifier for preview lanes (e.g. `preview.42`).
 *                Omit for production releases.
 * @returns Map of app project name to its release state
 */
export const getAppsToRelease = async (
  preid?: string
): Promise<Map<string, AppRelease>> => {
  const { projectsVersionData } = await releaseVersion({
    groups: ['apps'],
    ...(preid ? { preid } : {}),
    dryRun: true,
    gitCommit: false,
    gitTag: false,
    stageChanges: false
  });

  const releases = new Map<string, AppRelease>();

  for (const [projectName, { currentVersion, newVersion }] of Object.entries(
    projectsVersionData
  )) {
    releases.set(projectName, {
      // `newVersion` is null when conventional commits produced no bump
      version: newVersion ?? currentVersion,
      previousVersion: currentVersion,
      bumped: newVersion !== null
    });
  }

  return releases;
};
