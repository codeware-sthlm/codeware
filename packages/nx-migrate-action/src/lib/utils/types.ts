export type ActionInputs = {
  author: string;
  autoMerge: boolean;
  committer: string;
  dryRun: boolean;
  mainBranch: string;
  packagePatterns: string[];
  prAssignees: string;
  token: string;
};

export type ActionOutputs = Pick<
  VersionInfo,
  'currentVersion' | 'latestVersion' | 'isMajorUpdate'
> & {
  isMigrated: boolean;
  pullRequest: number | undefined;
};

export type MigrateConfig = Pick<
  ActionInputs,
  'autoMerge' | 'dryRun' | 'mainBranch' | 'packagePatterns' | 'token'
> & {
  author: NameEmail;
  committer: NameEmail;
  prAssignees: string[];
};

export type NameEmail = { name: string; email: string };

export type VersionInfo = {
  currentVersion: string;
  latestVersion: string;
  isMajorUpdate: boolean;
  isOutdated: boolean;
};
