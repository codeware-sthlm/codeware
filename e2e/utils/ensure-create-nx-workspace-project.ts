import { existsSync, mkdirSync, readFileSync } from 'fs';
import { basename, join } from 'path';

import {
  getPackageVersion,
  isDebugEnabled,
  logDebug,
  logError,
  logInfo,
  runCommand
} from '@codeware/core/utils';
import {
  cleanup,
  directoryExists,
  exists,
  runNxCommand,
  tmpProjPath,
  uniq
} from '@nx/plugin/testing';

import { getE2EPackageManager } from './get-e2e-package-manager';

export type CreateNxWorkspaceProject = {
  /**
   * Name of application when one has been generated.
   *
   * @example
   * 'appdefault'
   */
  appName?: string;

  /**
   * Application directory relative to the workspace root,
   * when one has been generated.
   *
   * @example
   * 'apps/appdefault'
   */
  appDirectory?: string;

  /**
   * Project name used for generating the workspace with `create-nx-workspace`.
   *
   * @example
   * 'proj'
   */
  projectName: string;

  /**
   * Full path to project where the workspace was generated.
   *
   * Hint! Equivalent to `tmpProjPath()`.
   *
   * @example
   * '/users/username/tmp/nx-e2e/proj/'
   */
  projectPath: string;
};

type Options = {
  /**
   * Generate the app with a random name or provide your own.
   *
   * Leaving the default name makes debug easier when you want to run commands
   * in the e2e folder for the initial app with a known name.
   * @default 'appdefault''
   */
  appName: 'random' | { name: string };

  /**
   * Ensure the plugin gets installed in the workspace
   * @default false
   */
  ensurePluginIsInstalled: boolean;
};

/**
 * Ensure the creation of a new E2E Nx workspace project, using `create-nx-workspace`.
 * The version is resolved from the installed npm package.
 *
 * It's an alternative to `ensureNxProject` which uses the plugin build from local `dist` folder.
 * This function uses the local registry instead to setup the workspace in a more real world scenario.
 *
 * Package mananger can be set via environment variable `CDWR_E2E_PACKAGE_MANAGER`.
 *
 * @param preset Which preset to use as option to `create-nx-workspace`
 * @param options Workspace options
 * @returns Project workspace details
 */
export async function ensureCreateNxWorkspaceProject({
  preset,
  options
}: {
  preset: 'apps';
  options?: Pick<Options, 'ensurePluginIsInstalled'>;
}): Promise<CreateNxWorkspaceProject>;
export async function ensureCreateNxWorkspaceProject({
  preset,
  options
}: {
  preset: '@cdwr/nx-payload';
  options?: Pick<Options, 'appName'>;
}): Promise<CreateNxWorkspaceProject>;
export async function ensureCreateNxWorkspaceProject({
  preset,
  options
}: {
  preset: 'apps' | '@cdwr/nx-payload';
  options?: Partial<Options>;
}): Promise<CreateNxWorkspaceProject> {
  // Get the local version of `create-nx-workspace`
  const version = (await getPackageVersion('create-nx-workspace')) ?? 'latest';

  // Ensure the e2e temp path is removed
  try {
    cleanup();
  } catch (error) {
    logError('Failed to cleanup e2e temp path', (error as Error).message);
  }

  const pm = getE2EPackageManager();
  logDebug(
    'Resolved',
    `create-nx-workspace: ${version}, test package manager: ${pm}`
  );

  // Prepare the options for `create-nx-workspace`
  const cmdOptions = [
    '--nxCloud',
    'skip',
    '--no-interactive',
    '--packageManager',
    pm
  ];

  let appName: string | undefined;
  let appDirectory: string | undefined;

  // Add required options for `@cdwr/nx-payload` preset
  if (preset === '@cdwr/nx-payload') {
    // Set app name from options or a default static name
    appName = !options?.appName
      ? 'appdefault'
      : options.appName === 'random'
        ? uniq('app')
        : options.appName.name;

    appDirectory = `apps/${appName}`;

    cmdOptions.unshift(
      '--payloadAppName',
      appName,
      '--payloadAppDirectory',
      appDirectory
    );
  }

  // The workspace should created in the e2e temp path
  const projectPath = tmpProjPath();
  const projectName = basename(projectPath);
  const runPath = join(projectPath, '..');

  // Ensure run path exists
  if (!directoryExists(runPath)) {
    mkdirSync(runPath, { recursive: true });
  }

  const cmd = `npx create-nx-workspace@${version} ${projectName} --preset ${preset} ${cmdOptions.join(' ')}`;

  logDebug('Creating Nx workspace project', `Preset '${preset}'`);
  logDebug('Run command', cmd);

  try {
    const result = await runCommand(cmd, {
      cwd: runPath,
      errorDetector: /ChildProcess\.exithandler/i
    });

    logDebug('Command output', result);

    if (!exists(projectPath)) {
      logDebug('Run path', runPath);
      if (!isDebugEnabled()) {
        logError('Command output', result);
      }

      // Try to find and print error log content
      const logMatch = result.match(/Log file: (?<errorLog>.*error\.log)/);
      if (logMatch?.groups) {
        const errorLog = logMatch.groups['errorLog'];
        if (existsSync(errorLog)) {
          logInfo(
            `Output from ${errorLog}\n`,
            readFileSync(errorLog, { encoding: 'utf-8' })
          );
        } else {
          logInfo('Error log file could not be found', errorLog);
        }
      }

      throw new Error(`Failed to create test project in "${projectPath}"`);
    }
  } catch (error) {
    logError('Command failed', String(error));
    throw new Error(`Failed to create test project in "${projectPath}"`);
  }

  if (preset === 'apps' && options?.ensurePluginIsInstalled) {
    logDebug('Install plugin in empty apps workspace');
    runNxCommand('add @cdwr/nx-payload');
  }

  return {
    appName,
    appDirectory,
    projectName,
    projectPath
  };
}
