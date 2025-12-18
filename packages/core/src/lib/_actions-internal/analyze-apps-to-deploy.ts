import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import {
  GitHubConfig,
  GitHubConfigSchema
} from '@codeware/shared/util/schemas';

import { findDown } from '../utils/find-down';

import { getNxApps } from './get-nx-apps';
import { getNxProject } from './get-nx-project';

const githubJsonFileName = 'github.json' as const;

type App = {
  /** Nx project name */
  projectName: string;
} & (
  | {
      status: 'deploy';
      /** Full path to the Fly configuration file */
      flyConfigFile: string;
      /** Parsed GitHub configuration */
      githubConfig: GitHubConfig;
    }
  | {
      status: 'skip';
      reason: string;
    }
);

/**
 * Analyzes Nx workspace apps to determine which are ready for deployment.
 *
 * Checks for the presence and validity of `github.json` files,
 * and whether deployment is enabled for each app.
 *
 * @returns List of apps with their deployment status and details.
 */
export const analyzeAppsToDeploy = async (): Promise<App[]> => {
  const response: App[] = [];

  // Create deployments based on affected apps
  const projectNames = await getNxApps('affected');

  // Analyze each project
  for (const projectName of projectNames) {
    // Get project configuration
    const projectConfig = await getNxProject(projectName);

    if (!projectConfig) {
      response.push({
        projectName,
        status: 'skip',
        reason: 'Nx project configuration not found'
      });
      continue;
    }

    // Find github.json
    const githubFile = await findDown(githubJsonFileName, {
      startDir: projectConfig.root
    });

    if (!githubFile) {
      response.push({
        projectName,
        status: 'skip',
        reason: `${githubJsonFileName} not found for the project`
      });
      continue;
    }

    // Read and parse github.json
    const githubConfigParsed = GitHubConfigSchema.safeParse(
      JSON.parse(readFileSync(githubFile, { encoding: 'utf-8' }))
    );

    if (!githubConfigParsed.success) {
      response.push({
        projectName,
        status: 'skip',
        reason: `Invalid ${githubJsonFileName}: ${githubConfigParsed.error.message}`
      });
      continue;
    }

    // Check if deployment is enabled
    const githubConfig = githubConfigParsed.data;
    if (!githubConfig.deploy) {
      response.push({
        projectName,
        status: 'skip',
        reason: `Deployment is disabled in ${githubJsonFileName} for the project`
      });
      continue;
    }

    // Verify that Fly config (normally fly.toml) actually exists
    const resolvedFlyConfig = join(projectConfig.root, githubConfig.flyConfig);
    if (!existsSync(resolvedFlyConfig)) {
      response.push({
        projectName,
        status: 'skip',
        reason: `Fly config file not found: ${resolvedFlyConfig}`
      });
      continue;
    }

    // All checks passed, mark the app ready for deployment
    response.push({
      projectName,
      status: 'deploy',
      flyConfigFile: resolvedFlyConfig,
      githubConfig
    });
  }

  return response;
};
