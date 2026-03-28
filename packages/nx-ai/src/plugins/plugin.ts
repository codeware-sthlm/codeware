import { type CreateNodesV2 } from '@nx/devkit';

// No options for now, but this can be extended in the future when needed.
export type NxAiPluginOptions = Record<string, never>;

/**
 * Nx plugin entry point.
 *
 * No targets are inferred in this version.
 * This will be populated when automatic target inference is introduced.
 */
export const createNodesV2: CreateNodesV2<NxAiPluginOptions> = [
  '**/project.json',
  async () => []
];
