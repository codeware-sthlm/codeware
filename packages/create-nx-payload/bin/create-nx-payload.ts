import { basename } from 'path';

import * as chalk from 'chalk';
import {
  type CreateWorkspaceOptions,
  createWorkspace
} from 'create-nx-workspace';
import {
  determineDefaultBase,
  determineNxCloud,
  determinePackageManager
} from 'create-nx-workspace/src/internal-utils/prompts';
import {
  withAllPrompts,
  withGitOptions,
  withNxCloud,
  withOptions,
  withPackageManager
} from 'create-nx-workspace/src/internal-utils/yargs-options';
import { output } from 'create-nx-workspace/src/utils/output';
import * as enquirer from 'enquirer';
import * as yargs from 'yargs';

export interface Arguments extends CreateWorkspaceOptions {
  /** Payload app name required by `nx-payload:preset` */
  payloadAppName: string;

  /** Payload app path required by `nx-payload:preset` */
  payloadAppDirectory: string;

  /** Payload optional database */
  database: 'mongodb' | 'postgres';

  /** @todo Plugin version to install */
  pluginVersion?: string;
}

/** Name of published package with the `preset` generator */
const pluginName = '@cdwr/nx-payload';

/**
 * CLI command arguments
 */
export const commandsObject: yargs.Argv<Arguments> = yargs
  .wrap(yargs.terminalWidth())
  .parserConfiguration({
    'strip-dashed': true,
    'dot-notation': true
  })
  .command<Arguments>(
    // this is the default and only command
    '$0 [name] [options]',
    'Create a new Nx workspace',

    // Builder
    (yargs) =>
      withOptions(
        yargs.middleware(
          (args) => normalizeArgsMiddleware(args as yargs.Arguments<Arguments>),
          false
        ),
        withNxCloud,
        withAllPrompts,
        withPackageManager,
        withGitOptions
      ),

    // Handler
    async (argv: yargs.ArgumentsCamelCase<Arguments>) => {
      await main(argv).catch((error) => {
        const { version } = require('../package.json');
        output.error({
          title: `Something went wrong! v${version}`
        });
        throw error;
      });
    }
  )
  .help('help', chalk.dim`Show help`)
  .version(
    'version',
    chalk.dim`Show version`,

    require('../package.json').version
  ) as yargs.Argv<Arguments>;

/**
 * Main function
 *
 * @param parsedArgs Parsed command arguments
 */
async function main(parsedArgs: yargs.Arguments<Arguments>): Promise<void> {
  output.log({
    title: `Creating your workspace.`,
    bodyLines: [
      'To make sure the command works reliably in all environments, and that the preset is applied correctly,',
      `Nx will run "${parsedArgs.packageManager} install" several times. Please wait.`
    ]
  });

  let presetName = pluginName;
  if (parsedArgs?.pluginVersion) {
    presetName += `@${parsedArgs.pluginVersion}`;
  }

  const workspaceInfo = await createWorkspace<Arguments>(
    presetName,
    parsedArgs
  );

  if (parsedArgs.nxCloud !== 'skip' && workspaceInfo.nxCloudInfo) {
    console.log(workspaceInfo.nxCloudInfo);
  }

  output.log({
    title: `Successfully initialized the ${pluginName} workspace`
  });
}

/**
 * `yargs` middleware to normalize command arguments
 *
 * @param argv Command arguments
 */
const normalizeArgsMiddleware: yargs.MiddlewareFunction<Arguments> = async (
  argv: yargs.Arguments<Arguments>
): Promise<void> => {
  try {
    output.log({
      title:
        "Let's create a new workspace [https://nx.dev/getting-started/intro]"
    });

    const preset = pluginName;
    const name = await resolveWorkspaceName(argv);
    const payloadAppName = await resolveAppName(argv);
    const payloadAppDirectory = await resolveDirectory(argv, payloadAppName);
    const database = await resolveDatabase(argv);

    const packageManager = await determinePackageManager(argv);
    const defaultBase = await determineDefaultBase(argv);
    const nxCloud = await determineNxCloud(argv);

    Object.assign(argv, {
      name,
      payloadAppName,
      payloadAppDirectory,
      database,
      preset,
      nxCloud,
      packageManager,
      defaultBase
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    process.exit(1);
  }
};

/**
 * Resolve workspace name
 *
 * 1. First argument
 * 2. `--name` argument
 *
 * Fallback: suggest project name
 *
 * @param parsedArgs Parsed command arguments
 * @returns Workspace name
 */
async function resolveWorkspaceName(
  parsedArgs: yargs.Arguments<Arguments>
): Promise<string> {
  // First argument or by `name`
  const name: string = parsedArgs._[0]
    ? parsedArgs._[0].toString()
    : parsedArgs.name;

  if (name) {
    return Promise.resolve(name);
  }

  const initial = basename(parsedArgs['$0']);

  const a = await enquirer.prompt<{ Name: string }>([
    {
      name: 'Name',
      message: 'Workspace name'.padEnd(35),
      type: 'input',
      initial
    }
  ]);
  if (!a.Name) {
    output.error({
      title: 'Invalid workspace name',
      bodyLines: [`Workspace name cannot be empty`]
    });
    process.exit(1);
  }
  return a.Name;
}

/**
 * Resolve application name
 *
 * Fallback: suggest `payload-admin`
 *
 * @param parsedArgs Parsed command arguments
 * @returns Application name
 */
async function resolveAppName(
  parsedArgs: yargs.Arguments<Arguments>
): Promise<string> {
  if (parsedArgs.payloadAppName) {
    return Promise.resolve(parsedArgs.payloadAppName);
  }

  return enquirer
    .prompt<{ PayloadAppName: string }>([
      {
        name: 'PayloadAppName',
        message: 'Application name'.padEnd(35),
        type: 'input',
        initial: 'payload-admin'
      }
    ])
    .then((a) => {
      if (!a.PayloadAppName) {
        output.error({
          title: 'Invalid name',
          bodyLines: [`Name cannot be empty`]
        });
        process.exit(1);
      }
      return a.PayloadAppName;
    });
}

/**
 * Resolve application path
 *
 * Fallback: suggest `apps/{appName}`
 *
 * @param parsedArgs Parsed command arguments
 * @param appName Selected app name
 * @returns Application path
 */
async function resolveDirectory(
  parsedArgs: yargs.Arguments<Arguments>,
  appName: string
): Promise<string> {
  if (parsedArgs.payloadAppDirectory) {
    return Promise.resolve(parsedArgs.payloadAppDirectory);
  }

  return enquirer
    .prompt<{ PayloadAppDirectory: string }>([
      {
        name: 'PayloadAppDirectory',
        message: 'Application path'.padEnd(35),
        type: 'input',
        initial: `apps/${appName}`
      }
    ])
    .then((a) => {
      if (!a.PayloadAppDirectory) {
        output.error({
          title: 'Invalid path',
          bodyLines: [`Application path cannot be empty`]
        });
        process.exit(1);
      }
      return a.PayloadAppDirectory;
    });
}

/**
 * Resolve application database
 *
 * @param parsedArgs Parsed command arguments
 * @returns Application database
 */
async function resolveDatabase(
  parsedArgs: yargs.Arguments<Arguments>
): Promise<string> {
  if (parsedArgs.database) {
    return Promise.resolve(parsedArgs.database);
  }

  return enquirer
    .prompt<{ Database: string }>([
      {
        name: 'Database',
        message: 'Preferred database'.padEnd(35),
        type: 'select',
        choices: ['mongodb', 'postgres']
      }
    ])
    .then((a) => {
      if (!a.Database) {
        output.error({
          title: 'Invalid database',
          bodyLines: [`Database cannot be empty`]
        });
        process.exit(1);
      }
      return a.Database;
    });
}
