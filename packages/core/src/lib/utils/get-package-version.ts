import { logDebug } from './log-utils';
import { execFile } from './promisified-exec';

type NpmList = {
  dependencies?: Record<string, { version: string }>;
};

/**
 * Get the npm executable for the current platform
 *
 * @returns 'npm' or 'npm.cmd'
 */
function getNpmExecutable(): string {
  if (process.platform === 'win32') {
    return process.env['npm_execpath'] || 'npm.cmd';
  }
  return 'npm';
}

/**
 * Get version of a local installed package
 *
 * @param packageName Package name
 * @returns Package version or empty string when not found
 */
export async function getPackageVersion(packageName: string): Promise<string> {
  let version: string | undefined;

  try {
    const { stdout } = await execFile(getNpmExecutable(), [
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
