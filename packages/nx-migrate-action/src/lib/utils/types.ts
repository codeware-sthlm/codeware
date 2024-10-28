import { z } from 'zod';

import { ActionInputsSchema, MigrateConfigSchema } from './schema';

export type ActionInputs = z.infer<typeof ActionInputsSchema>;

export type ActionOutputs = Pick<
  VersionInfo,
  'currentVersion' | 'latestVersion' | 'isMajorUpdate'
> & {
  isMigrated: boolean;
  pullRequest: number | undefined;
};

export type MigrateConfig = z.infer<typeof MigrateConfigSchema>;

export type VersionInfo = {
  currentVersion: string;
  latestVersion: string;
  isMajorUpdate: boolean;
  isOutdated: boolean;
};
