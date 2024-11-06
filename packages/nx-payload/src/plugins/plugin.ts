import { readdirSync } from 'fs';
import { dirname, join } from 'path';
import { posix } from 'path/posix';

import {
  type CreateDependencies,
  type CreateNodes,
  ProjectConfiguration,
  type TargetConfiguration,
  detectPackageManager,
  readJsonFile
} from '@nx/devkit';
import { calculateHashForCreateNodes } from '@nx/devkit/src/utils/calculate-hash-for-create-nodes';
import { getLockFileName } from '@nx/js';

import { cachePath, targetsCache, writeTargetsToCache } from './utils/cache';
import { createPayloadTargets } from './utils/create-payload-targets';
import { normalizeOptions } from './utils/normalize-options';
import type { PayloadPluginOptions } from './utils/types';

/**
 * Export Nx hook functions to make the plugin support Project Crystal
 *
 * @see https://nx.dev/extending-nx/recipes/project-graph-plugins#extending-the-project-graph-of-nx
 */

/** Global calculated target from either cache or run-time */
const calculatedTargets: Record<
  string,
  Record<string, TargetConfiguration>
> = {};

/**
 * Allows a plugin to tell Nx about dependencies between projects.
 *
 * @see https://nx.dev/extending-nx/recipes/project-graph-plugins#adding-new-dependencies-to-the-project-graph
 */
export const createDependencies: CreateDependencies = () => {
  writeTargetsToCache(cachePath, calculatedTargets);
  return [];
};

/**
 * Allows a plugin to tell Nx information about projects that are identified by a given file.
 * For `nx-payload` it's the `payload.config.ts` file.
 *
 * All projects that are identified by this file will infer `build` and `payload` targets
 * when the plugin is defined in `nx.json`.
 *
 * ```ts
 * // nx.json
 * "plugins": [
 *   {
 *     "plugin": "@cdwr/nx-payload/plugin",
 *     "options": {
 *       "buildTargetName": "build",
 *       "payloadTargetName": "payload"
 *     }
 *   },
 *   // or shorter using default target names
 *   "@cdwr/nx-payload/plugin"
 *   ...
 * ]
 * ```
 *
 * @see https://nx.dev/extending-nx/recipes/project-graph-plugins#adding-new-nodes-to-the-project-graph
 */
export const createNodes: CreateNodes<PayloadPluginOptions> = [
  '**/payload.config.ts',
  async (configFilePath, options, context) => {
    // Payload config file is located in `src` folder, hence project root is one level up.
    // Preserve unix path separators as the project root is used as a key in the project graph.
    // This is important on Windows since `path.join` will return backslashes.
    const projectRoot = posix.join(dirname(configFilePath), '..');

    // Do not create a project if package.json and project.json isn't there.
    const siblingFiles = readdirSync(join(context.workspaceRoot, projectRoot));
    if (
      !siblingFiles.includes('package.json') &&
      !siblingFiles.includes('project.json')
    ) {
      return {};
    }

    const projectConfig = readJsonFile<ProjectConfiguration>(
      join(context.workspaceRoot, projectRoot, 'project.json')
    );

    const normalizedOptions = normalizeOptions(options);

    const hash = await calculateHashForCreateNodes(
      projectRoot,
      normalizedOptions,
      context,
      [getLockFileName(detectPackageManager(context.workspaceRoot))]
    );

    const targets = targetsCache[hash]
      ? targetsCache[hash]
      : await createPayloadTargets(
          projectRoot,
          projectConfig,
          normalizedOptions,
          context
        );

    calculatedTargets[hash] = targets;

    return {
      projects: {
        [projectRoot]: {
          root: projectRoot,
          targets
        }
      }
    };
  }
];
