import { z } from 'zod';

import { ActionInputsSchema, MigrateConfigSchema } from './schema';

export type ActionInputs = z.infer<typeof ActionInputsSchema>;

export type ActionOutputs = Pick<
  VersionInfo,
  'currentVersion' | 'latestVersion' | 'updateType'
> & {
  isMigrated: boolean;
  pullRequest: number | undefined;
};

export type MigrateConfig = z.infer<typeof MigrateConfigSchema>;

/** A prompt migration Nx left for a developer to apply */
export type DeferredPrompt = {
  /** Migration name */
  name: string;
  /** Workspace relative path to the prompt file */
  prompt: string;
};

export type VersionInfo = {
  currentVersion: string;
  latestVersion: string;
  updateType: 'major' | 'minor' | 'patch' | 'none';
};
