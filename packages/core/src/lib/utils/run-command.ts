import { exec } from 'child_process';

import { tmpProjPath } from '@nx/plugin/testing';

import { logDebug, logError } from './log-utils';

type Options = {
  /** The working directory to run the command in */
  cwd?: string;
  /** The environment variables to pass to the command */
  env?: NodeJS.ProcessEnv;
  /** Whether to log debug messages */
  verbose?: boolean;
  /** Error detector RegExp to determine when to terminate the running process and fail */
  errorDetector?: RegExp;
  /** Predicate function to determine when to exit the running process */
  doneFn?: (log: string) => boolean;
};

/**
 * Run a command and provide an optional predicate function to determine when to exit the running process.
 *
 * The command is executed inside the e2e project directory unless specified otherwise.
 *
 * The predicate function is called for each log line and should return `true` to exit the running process.
 * It's useful when the command isn't terminated by itself, for example when running a `serve` command.
 *
 * This function is a replacement for Nx provided `runCommand` or `runNxCommand`.
 *
 * @param command Command to run
 * @param options Options to pass when executing the command
 * @returns Complete logs output from the executed command
 *
 * @example
 * ```ts
 * const output = await runCommand('serve my-app', {
 *   doneFn: (log) => log.includes('listening on port 3000')
 * });
 * expect(output.includes('some expected log output')).toBeTruthy();
 * ```
 */
export function runCommand(
  command: string,
  options?: Options
): Promise<string> {
  const cwd = options?.cwd ?? tmpProjPath();
  const doneFn = options?.doneFn;
  const env = options?.env ?? process.env;
  const errorDetector = options?.errorDetector;
  const verbose = options?.verbose;

  if (verbose) {
    logDebug('Running command...', command);
  }

  const controller = new AbortController();
  const { signal } = controller;

  const p = exec(command, {
    cwd,
    encoding: 'utf-8',
    env,
    signal
  });

  return new Promise((resolve, reject) => {
    let output = '';
    let complete = false;

    // Check if the optional predicate function is met
    const checkLog = (log: string) => {
      if (verbose) {
        logDebug(log);
      }
      output += log;

      if (errorDetector && log.match(errorDetector)) {
        logDebug(
          'Error detector found a match, terminate command with failure',
          log
        );
        return terminate(output, 'fail');
      }

      if (doneFn && doneFn(log) && !complete) {
        complete = true;
        logDebug('Predicate function met, terminate command successfully', log);
        terminate(output, 'success');
      }
    };

    // Abort the process and resolve when successful, otherwise reject with the error
    const terminate = (result: string, status: 'success' | 'fail') => {
      if (!signal.aborted) {
        controller.abort();
      }
      if (status === 'success') {
        resolve(result);
      } else {
        reject(result);
      }
    };

    // Listen for stdout and stderr
    p.stdout?.on('data', checkLog);
    p.stderr?.on('data', checkLog);

    // Listen for error and terminate when process is still running
    p.on('error', (err) => {
      if (signal.aborted) {
        return;
      }
      logError('Received error event');
      terminate(err.message, 'fail');
    });

    // Listen for exit event
    p.on('exit', (code) => {
      if (doneFn && !complete) {
        logError(
          'Command output:',
          output
            .split('\n')
            .map((l) => `    ${l}`)
            .join('\n')
        );
        reject(`Exited with ${code}`);
      } else {
        terminate(output, 'success');
      }
    });
  });
}
