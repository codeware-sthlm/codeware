import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import {
  GitHubConfig,
  GitHubConfigSchema
} from '@codeware/shared/util/schemas';

import { getAppsToRelease } from './get-apps-to-release';
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
      /** Version to stamp into the image and release as */
      version: string;
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
 * Selection is driven by `nx release`, not `nx affected`: an app deploys when
 * its conventional commits produce a version bump since its last release tag.
 * Affected answers "what must be rebuilt and retested", which is a strictly
 * wider question than "what changed for the consumer".
 *
 * @param environment - Environment to look for environment-specific fly configs or undefined
 * @param preid - Prerelease identifier for preview lanes (e.g. `preview.42`)
 * @param apps - Explicit app project names, bypassing bump selection. Used by
 *               manual dispatch to force a redeploy of an unbumped app.
 * @returns List of apps with their deployment status and details.
 */
export const analyzeAppsToDeploy = async (
  environment: string | undefined,
  preid?: string,
  apps?: string[]
): Promise<App[]> => {
  const response: App[] = [];

  const releases = await getAppsToRelease(preid);

  // A forced app deploys at its last released version when nothing bumped it
  const projectNames =
    apps ??
    [...releases].filter(([, { bumped }]) => bumped).map(([name]) => name);

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

    // Nothing to stamp into the image, so nothing that can be released
    const release = releases.get(projectName);

    if (!release) {
      response.push({
        projectName,
        status: 'skip',
        reason: 'Not a member of the `apps` release group'
      });
      continue;
    }

    // All checks passed, mark the app ready for deployment
    const githubConfig = githubConfigParsed.data;
    response.push({
      projectName,
      status: 'deploy',
      flyConfigFile,
      githubConfig,
      version: release.version
    });
  }

  return response;
};
