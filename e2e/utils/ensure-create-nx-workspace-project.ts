import { existsSync, mkdirSync, readFileSync } from 'fs';
import { basename, join } from 'path';
import { cwd } from 'process';

import {
  getPackageVersion,
  isDebugEnabled,
  logDebug,
  logError,
  logInfo,
  logWarning,
  runCommand
} from '@codeware/core/utils';
import { type PackageManager, readJsonFile } from '@nx/devkit';
import {
  directoryExists,
  exists,
  runNxCommand,
  tmpProjPath,
  uniq
} from '@nx/plugin/testing';

import { cleanupE2E } from './cleanup-e2e';
import { getE2EPackageManager } from './get-e2e-package-manager';

export type CreateNxWorkspaceProject = {
  /**
   * Name of application when one has been generated.
   *
   * @default 'app-default'
   */
  appName?: string;

  /**
   * Application directory relative to the workspace root,
   * when one has been generated.
   *
   * @default 'apps/{appName}'
   */
  appDirectory?: string;

  /**
   * Project name used for generating the workspace with `create-nx-workspace`.
   *
   * @default 'proj'
   */
  projectName: string;

  /**
   * Full path to project where the workspace was generated.
   *
   * **Hint!** Equivalent to `tmpProjPath()`.
   *
   * @default '{workspacePath}/tmp/nx-e2e/proj/'
   */
  projectPath: string;

  /**
   * Package manager used to create the workspace.
   */
  packageManager: PackageManager;
};

type Options = {
  /**
   * Generate the app with a random name or provide your own.
   *
   * Leaving the default name makes debug easier when you want to run commands
   * in the e2e folder for the initial app with a known name.
   * @default 'app-default'
   */
  appName?: 'random' | { name: string };

  /**
   * Ensure `@cdwr/nx-payload` plugin gets installed in the workspace
   * @default false
   */
  ensureNxPayload?: boolean;
};

/**
 * Ensure the creation of a new E2E Nx workspace project, using `create-nx-workspace`.
 *
 * It's an alternative to `ensureNxProject` which uses the plugin build from local `dist` folder.
 * This function uses the local registry instead to setup the workspace in a more realistic scenario.
 *
 * - Version is set via environment variable `CDWR_E2E_NX_VERSION` or fall back to the installed version of `create-nx-workspace`.
 * - Package mananger is set via environment variable `CDWR_E2E_PACKAGE_MANAGER` or fall back to the workspace package manager.
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
  options?: Pick<Options, 'ensureNxPayload'>;
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
  options?: Options;
}): Promise<CreateNxWorkspaceProject> {
  // Get version from environment variable or the local version of `create-nx-workspace`
  let version =
    process.env.CDWR_E2E_NX_VERSION ||
    (await getPackageVersion('create-nx-workspace'));

  // Windows workaround when `npm list` fails unexpectedly
  if (!version) {
    logInfo(
      'Could not resolve nx version, try to read from workspace package.json'
    );
    const packageJsonPath = join(cwd(), 'package.json');

    if (existsSync(packageJsonPath)) {
      const packageJson = readJsonFile<{
        devDependencies: Record<string, string>;
      }>(packageJsonPath);

      version = packageJson.devDependencies['create-nx-workspace'];
    }
  }

  if (!version) {
    logWarning(`Could not resolve nx version, fall back to 'latest'`);
    version = 'latest';
  }

  // Ensure the e2e temp path is removed
  await cleanupE2E();

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
      ? 'app-default'
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

  if (preset === 'apps' && options?.ensureNxPayload) {
    logDebug('Install @cdwr/nx-payload plugin in the empty apps workspace');
    runNxCommand('add @cdwr/nx-payload');
  }

  logDebug('Workspace created and ready for use', projectPath);

  return {
    appName,
    appDirectory,
    packageManager: pm,
    projectName,
    projectPath
  };
}
