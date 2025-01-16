import {
  SpawnOptions as SpawnOptionsChildProcess,
  spawn as cpSpawn
} from 'child_process';

export type SpawnOptions = Exclude<SpawnOptionsChildProcess, 'stdio'>;

/**
 * Promisified version of the `spawn` function from the `child_process` module.
 *
 * **Note!**
 *
 * The process is considered successful if it resolves, no matter the output of `stdout` or `stderr`.
 *
 * @param command - The command to spawn.
 * @param args - The arguments to pass to the command.
 * @param options - The options to pass to the child process.
 * @returns A promise that resolves with the stdout and stderr of the child process.
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

    process.stdout.on('data', (data) => {
      stdoutChunks.push(Buffer.from(data));
    });

    process.stderr.on('data', (data) => {
      stderrChunks.push(Buffer.from(data));
    });

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
