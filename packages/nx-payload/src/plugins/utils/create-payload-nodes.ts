import { dirname, join, relative } from 'path/posix';

import {
  type CreateNodesContext,
  type CreateNodesResult,
  type ProjectConfiguration,
  type TargetConfiguration,
  detectPackageManager,
  normalizePath,
  readJsonFile
} from '@nx/devkit';
import { calculateHashForCreateNodes } from '@nx/devkit/src/utils/calculate-hash-for-create-nodes';
import { getLockFileName } from '@nx/js';

import { createPayloadTargets } from '../../utils/create-payload-targets';
import { extractPayloadConfig } from '../../utils/extract-payload-config';
import { findUpFs } from '../../utils/find-up-fs';

import {
  type PayloadPluginOptions,
  normalizePluginOptions
} from './normalize-plugin-options';

/**
 * Create Payload nodes for a project
 *
 * @param configFilePath - Path to the Payload config file provided by `createNodesFromFiles`
 * @param context - Create nodes context
 * @param options - Plugin options
 * @param targetsCache - Targets cache
 */
export const createPayloadNodes = async (
  configFilePath: string,
  context: CreateNodesContext,
  options: PayloadPluginOptions | undefined,
  targetsCache: Record<
    string,
    Record<string, TargetConfiguration<PayloadPluginOptions>>
  >
): Promise<CreateNodesResult> => {
  // Convert to POSIX on Windows (workspacePath is os formatted)
  const workspaceRoot = normalizePath(context.workspaceRoot);

  // configFilePath is POSIX formatted
  const configRoot = dirname(configFilePath);
  const fullConfigRoot = join(workspaceRoot, configRoot);

  // Payload config file can be located anywhere, though it's generated initially in the 'src' folder.
  // Find project root by looking for project.json in a parent directory.
  const projectJsonPath = await findUpFs('project.json', {
    startPath: fullConfigRoot,
    stopAtPath: workspaceRoot
  });

  // Do not create targets if project.json isn't found.
  // Plugin limitation: Nx native plugins also allow package.json to be used as a project file.
  if (!projectJsonPath) {
    return {};
  }

  // Create path for project root, e.g. 'apps/my-app'
  const projectRoot = relative(workspaceRoot, dirname(projectJsonPath));

  const { name: projectName } =
    readJsonFile<ProjectConfiguration>(projectJsonPath);

  // Get current GraphQL config state
  const result = extractPayloadConfig(configRoot, 'graphQL.disable');
  if (!result.config) {
    // Don't throw to prevent messing up the targets
    console.error(result.error);
    console.warn(
      `Could not extract Payload config from ${configFilePath}, GraphQL state is not known`
    );
  }
  const isGraphQLDisabled = result?.config?.graphQL?.disable ?? true;

  const hash = await calculateHashForCreateNodes(
    projectRoot,
    normalizePluginOptions(options),
    context,
    [
      getLockFileName(detectPackageManager(workspaceRoot)),
      String(isGraphQLDisabled)
    ]
  );

  // Get payload targets to be inferred for the project
  targetsCache[hash] ??= createPayloadTargets({
    isGraphQLDisabled,
    projectName: String(projectName), // Should have a value by design?
    projectRoot
  });

  return {
    projects: {
      [projectRoot]: {
        root: projectRoot,
        targets: targetsCache[hash]
      }
    }
  };
};
