import { execFile } from 'child_process';
import { promisify } from 'util';

import { logDebug } from './log-utils';

const execAsync = promisify(execFile);

type NpmList = {
  dependencies?: Record<string, { version: string }>;
};

/**
 * Get version of a local installed package
 *
 * @param packageName Package name
 * @returns Package version or empty string when not found
 */
export async function getPackageVersion(packageName: string): Promise<string> {
  let version: string | undefined;

  try {
    const { stdout } = await execAsync('npm', [
      'list',
      packageName,
      '--depth=0',
      '--json'
    ]);
    const { dependencies }: NpmList = JSON.parse(stdout);

    const pkg = dependencies && dependencies[packageName];
    version = pkg?.version;
  } catch (error) {
    logDebug(
      `Failed to get version for package ${packageName}`,
      (error as Error).message
    );
  }

  return version ?? '';
}
