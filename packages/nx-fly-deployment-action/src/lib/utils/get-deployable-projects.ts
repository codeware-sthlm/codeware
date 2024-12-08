import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { getPackageManagerCommand } from '@nx/devkit';

/**
 * Get the deployable projects.
 *
 * Deployable projects are the applications that are affected by the recent code changes.
 *
 * @returns List of project names
 */
export const getDeployableProjects = async (): Promise<Array<string>> => {
  const pmc = getPackageManagerCommand();

  core.info('Getting deployable projects');

  // TODO: Opt-out from only getting affected projects
  const { stdout } = await exec.getExecOutput(pmc.exec, [
    'nx',
    'show',
    'projects',
    '--type',
    'app',
    '--affected',
    '--json'
  ]);

  const parsedOutput = JSON.parse(stdout);

  if (!Array.isArray(parsedOutput)) {
    throw new Error('Expected output to be an array');
  }

  return parsedOutput;
};
