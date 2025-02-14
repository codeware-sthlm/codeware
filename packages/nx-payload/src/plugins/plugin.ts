import { existsSync } from 'fs';
import { join } from 'path/posix';

import {
  CreateNodesV2,
  type TargetConfiguration,
  createNodesFromFiles,
  readJsonFile,
  writeJsonFile
} from '@nx/devkit';
import { hashObject } from 'nx/src/devkit-internals';
import { workspaceDataDirectory } from 'nx/src/utils/cache-directory';

import { createPayloadNodes } from './utils/create-payload-nodes';
import type { PayloadPluginOptions } from './utils/normalize-plugin-options';

const payloadConfigBlob = '**/payload.config.ts';

function readTargetsCache(
  cachePath: string
): Record<string, Record<string, TargetConfiguration<PayloadPluginOptions>>> {
  return existsSync(cachePath) ? readJsonFile(cachePath) : {};
}

function writeTargetsToCache(
  cachePath: string,
  targetsCache: Record<string, TargetConfiguration<PayloadPluginOptions>>
) {
  const oldCache = readTargetsCache(cachePath);
  writeJsonFile(cachePath, {
    ...oldCache,
    ...targetsCache
  });
}

export const createNodesV2: CreateNodesV2<PayloadPluginOptions> = [
  payloadConfigBlob,
  async (configFiles, options, context) => {
    const optionsHash = hashObject(options ?? {});
    const cachePath = join(
      workspaceDataDirectory,
      `payload-${optionsHash}.json`
    );
    const targetsCache = readTargetsCache(cachePath);

    try {
      return await createNodesFromFiles(
        (configFile, options, context) =>
          createPayloadNodes(configFile, context, options, targetsCache),
        configFiles,
        options,
        context
      );
    } finally {
      writeTargetsToCache(cachePath, targetsCache);
    }
  }
];
