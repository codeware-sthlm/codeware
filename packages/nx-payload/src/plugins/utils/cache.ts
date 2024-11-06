import { existsSync } from 'fs';
import { join } from 'path/posix';

import {
  type CreateNodesResult,
  type TargetConfiguration,
  readJsonFile,
  writeJsonFile
} from '@nx/devkit';
import { workspaceDataDirectory } from 'nx/src/utils/cache-directory';

export const cachePath = join(workspaceDataDirectory, 'payload.hash');

/** Global calculated target from either cache or run-time */

export const calculatedTargets: Record<
  string,
  Record<string, Record<string, TargetConfiguration>>
> = {};

const readTargetsCache = (
  cachePath: string
): Record<string, Record<string, TargetConfiguration>> => {
  return process.env.NX_CACHE_PROJECT_GRAPH !== 'false' && existsSync(cachePath)
    ? readJsonFile(cachePath)
    : {};
};

export const targetsCache = readTargetsCache(cachePath);

export const writeTargetsToCache = (
  cachePath: string,
  results: Record<string, TargetConfiguration>
) => writeJsonFile(cachePath, results);

//
// Nx 20+ V2 specifications
//

export const calculatedTargetsV2: Record<
  string,
  Record<string, CreateNodesResult['projects']>
> = {};

const readTargetsCacheV2 = (
  cachePath: string
): Record<string, CreateNodesResult['projects']> => {
  return process.env.NX_CACHE_PROJECT_GRAPH !== 'false' && existsSync(cachePath)
    ? readJsonFile(cachePath)
    : {};
};

export const targetsCacheV2 = readTargetsCacheV2(cachePath);

export const writeTargetsToCacheV2 = (
  cachePath: string,
  results: Record<string, CreateNodesResult['projects']>
) => writeJsonFile(cachePath, results);
