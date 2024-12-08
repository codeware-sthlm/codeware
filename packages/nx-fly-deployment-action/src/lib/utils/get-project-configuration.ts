import * as core from '@actions/core';
import * as exec from '@actions/exec';
import {
  type ProjectConfiguration,
  getPackageManagerCommand
} from '@nx/devkit';

/**
 * Get the project configuration.
 *
 * A verified project configuration contains the following fields:
 * - name
 * - sourceRoot
 *
 * @param projectName - The name of the project
 * @returns Project configuration or `null` if not found
 */
export const getProjectConfiguration = async (
  projectName: string
): Promise<ProjectConfiguration | null> => {
  const pmc = getPackageManagerCommand();

  core.info(`Get project configuration for ${projectName}`);

  const { stdout } = await exec.getExecOutput(
    pmc.exec,
    ['nx', 'show', 'project', projectName, '--json'],
    {
      silent: true
    }
  );

  const config: ProjectConfiguration = JSON.parse(stdout);

  // Rudimentary check of the project configuration
  if (config.name !== projectName || !config.root) {
    return null;
  }

  return config;
};
