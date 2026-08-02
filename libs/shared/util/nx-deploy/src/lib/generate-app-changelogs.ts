import { releaseChangelog } from 'nx/release';

export type AppChangelogRange = {
  /** Version the app was just released as */
  version: string;
  /** Version it was released from — the start of the changelog range */
  previousVersion: string;
};

export type AppChangelogOptions = {
  /** Release range per app, keyed by project name */
  releases: Map<string, AppChangelogRange>;
  /**
   * Create a GitHub release per app. Production only — a release per preview
   * push would bury the real ones. Previews surface the same contents as a
   * pull request comment instead.
   */
  createRelease: boolean;
};

/**
 * Render the changelog for each released app.
 *
 * No `CHANGELOG.md` is ever written — apps are not consumed by anyone, so a
 * committed changelog file has no audience and the branch is deliberately left
 * untouched by the release process. The contents are returned instead, and
 * `forceChangelogGeneration` is what lets nx render them without a file or a
 * remote release to write to.
 *
 * The range is nx's default: the app's last release tag up to `HEAD`. In a
 * preview lane that tag is the previous preview deploy, so the result reads as
 * "what this deploy adds", not "what this pull request adds".
 *
 * @param options - Released versions and whether to create GitHub releases
 * @returns Map of app project name to rendered markdown, skipping empty entries
 */
export const generateAppChangelogs = async ({
  releases,
  createRelease
}: AppChangelogOptions): Promise<Map<string, string>> => {
  if (releases.size === 0) {
    return new Map();
  }

  const { projectChangelogs } = await releaseChangelog({
    projects: [...releases.keys()],
    versionData: Object.fromEntries(
      [...releases].map(([projectName, { version, previousVersion }]) => [
        projectName,
        {
          currentVersion: previousVersion,
          newVersion: version,
          dependentProjects: []
        }
      ])
    ),
    createRelease: createRelease ? 'github' : false,
    forceChangelogGeneration: !createRelease,
    gitCommit: false,
    gitTag: false,
    stageChanges: false
  });

  const changelogs = new Map<string, string>();

  for (const [projectName, changelog] of Object.entries(
    projectChangelogs ?? {}
  )) {
    const contents = changelog.contents.trim();
    if (contents) {
      changelogs.set(projectName, contents);
    }
  }

  return changelogs;
};
