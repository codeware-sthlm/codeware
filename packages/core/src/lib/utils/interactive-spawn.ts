import {
  SpawnOptions as SpawnOptionsChildProcess,
  spawn as cpSpawn
} from 'child_process';

export type SpawnOptions = Exclude<SpawnOptionsChildProcess, 'stdio'> & {
  prompt?: (output: string) => string | undefined;
};

/**
 * Spawn a child process with interactive input support.
 *
 * Enable interactive input by setting the `prompt` option to a function that returns the user's answer.
 *
 * It's needed when the invoked command halts and waits for user input.
 * The process would otherwise hang until it times out.
 *
 * **Note!**
 *
 * The process is considered successful if it resolves, no matter the output of `stdout` or `stderr`.
 *
 * @param command - The command to spawn.
 * @param args - The arguments to pass to the command.
 * @param options - The options to pass to the child process.
 * @returns A promise that resolves with the stdout and stderr of the child process.
 *
 * @example
 * ```ts
 * await spawn('git', ['commit'], {
 *   prompt: (output) => {
 *     if (output.includes('Enter the commit message:')) {
 *       return 'Hello, world!';
 *     }
 *   }
 * });
 * ```
 */
export function spawn(
  command: string,
  args: readonly string[],
  options?: SpawnOptions
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    // Spawn the process with stdio set to 'pipe'
    const process = cpSpawn(command, args, {
      ...options,
      stdio: 'pipe'
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    // Handle stdout data and whether a user prompt is needed
    process.stdout.on('data', (data) => {
      stdoutChunks.push(Buffer.from(data));

      const output = data.toString();
      if (!options?.prompt) {
        return;
      }

      // Get the virtual user's answer from the prompt callback
      const answer = options.prompt(output);
      if (answer) {
        // Write the answer to the process's stdin to simulate user input
        process.stdin.write(`${answer}\n`);
      }
    });

    // Handle stderr data
    process.stderr.on('data', (data) => {
      stderrChunks.push(Buffer.from(data));
    });

    // Handle process close event
    process.on('close', (code) => {
      const stdout = Buffer.concat(stdoutChunks).toString();
      const stderr = Buffer.concat(stderrChunks).toString();

      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        // Reject with error to be consistent with 'error' event
        reject(new Error(`Process exited with code ${code}\nError: ${stderr}`));
      }
    });

    // Reject with the error
    process.on('error', reject);
  });
}
