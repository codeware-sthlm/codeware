import * as exec from '@actions/exec';
import { getPackageManagerCommand } from '@nx/devkit';

/**
 * Get a list of Nx projects.
 *
 * @param select - Whether to select all apps or only affected apps (default: 'all')
 * @returns List of project names
 * @throws If command fails or output is invalid
 */
export const getNxApps = async (
  select: 'all' | 'affected' = 'all'
): Promise<Array<string>> => {
  const pmc = getPackageManagerCommand();
  const args = [
    'nx',
    'show',
    'projects',
    '--type',
    'app',
    select === 'affected' ? '--affected' : '',
    '--json'
  ].filter(Boolean);

  const { stdout } = await exec.getExecOutput(pmc.exec, args);

  const parsedOutput = JSON.parse(stdout);

  if (!Array.isArray(parsedOutput)) {
    throw new Error('Expected output to be an array');
  }

  return parsedOutput;
};
