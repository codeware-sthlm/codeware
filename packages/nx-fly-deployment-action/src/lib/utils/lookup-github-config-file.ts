import { promises, readFileSync } from 'fs';
import { basename, join } from 'path';

import { GitHubConfigSchema } from '../schemas/github-config.schema';
import type { GitHubConfig } from '../schemas/github-config.schema';

export async function findDown(
  filename: string,
  startDir: string
): Promise<string | null> {
  // Get all files recursively, returns paths relative to startDir
  const files = await promises.readdir(startDir, { recursive: true });

  // Find first file matching the name we want
  const found = files.find((file) => basename(file.toString()) === filename);

  // Convert relative path to absolute if found
  return found ? join(startDir, found.toString()) : null;
}

type Response = {
  configFile: string;
  content: GitHubConfig;
};

/**
 * Lookup the GitHub configuration file `github.json` and return its content.
 *
 * The file can be stored anywhere in the project
 * and its content is validated by schema.
 *
 * @param projectRoot - The project root
 * @returns The GitHub configuration file and content or `null` if the file is not found
 */
export const lookupGitHubConfigFile = async (
  projectRoot: string
): Promise<Response | null> => {
  const configFile = await findDown('github.json', projectRoot);

  if (!configFile) {
    return null;
  }

  return {
    configFile,
    content: GitHubConfigSchema.parse(
      JSON.parse(readFileSync(configFile, { encoding: 'utf-8' }))
    )
  };
};
