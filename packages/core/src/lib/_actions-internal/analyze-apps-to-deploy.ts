import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import {
  GitHubConfig,
  GitHubConfigSchema
} from '@codeware/shared/util/schemas';

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
 * Find fly.toml config file for deployment in app root.
 *
 * Priority:
 * 1. `fly.{environment}.toml` (if environment has a value)
 * 2. `fly.toml`
 *
 * @param appRoot - App root directory
 * @param environment - Environment or undefined
 * @returns Full path to the fly config file, or null if not found
 */
const findFlyConfig = (
  appRoot: string,
  environment: string | undefined
): string | null => {
  // Try environment-specific config first
  if (environment) {
    const envConfig = join(appRoot, `fly.${environment}.toml`);
    if (existsSync(envConfig)) {
      return envConfig;
    }
  }

  // Try default fly.toml
  const defaultConfig = join(appRoot, 'fly.toml');
  if (existsSync(defaultConfig)) {
    return defaultConfig;
  }

  return null;
};

/**
 * Analyzes Nx workspace apps to determine which are ready for deployment.
 *
 * Checks for the presence and validity of `github.json` files in app root,
 * and looks for fly configuration files.
 *
 * @param environment - Environment to look for environment-specific fly configs or undefined
 * @returns List of apps with their deployment status and details.
 */
export const analyzeAppsToDeploy = async (
  environment: string | undefined
): Promise<App[]> => {
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

    const appRoot = projectConfig.root;

    // Look for github.json in app root
    const githubFile = join(appRoot, githubJsonFileName);

    if (!existsSync(githubFile)) {
      response.push({
        projectName,
        status: 'skip',
        reason: `${githubJsonFileName} not found in app root`
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

    // Look for a Fly config file
    const flyConfigFile = findFlyConfig(appRoot, environment);

    if (!flyConfigFile) {
      response.push({
        projectName,
        status: 'skip',
        reason: `No Fly configuration found in app root`
      });
      continue;
    }

    // All checks passed, mark the app ready for deployment
    const githubConfig = githubConfigParsed.data;
    response.push({
      projectName,
      status: 'deploy',
      flyConfigFile,
      githubConfig
    });
  }

  return response;
};
