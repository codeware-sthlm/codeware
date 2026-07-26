import { spawn } from '@homebridge/node-pty-prebuilt-multiarch';

export type SpawnPtyOptions = {
  prompt?: (output: string) => string | undefined;
};

/**
 * Forks a child process as a pseudo terminal with support for interactive prompt input.
 *
 * By using the `prompt` property it's possible to provide user interaction programatically.
 *
 * It can be needed when the invoked command halts and waits for user input.
 * The process would otherwise hang until it times out.
 *
 * @param command - The command to spawn in a pseudo terminal.
 * @param args - Optional arguments to pass to the command.
 * @param options - Options for the spawnPty function.
 * @returns A promise that resolves with the output of the child process.
 *
 * @example
 * ```ts
 * await spawnPty('git', ['commit'], {
 *   prompt: (output) => {
 *     if (output.includes('Enter the commit message:')) {
 *       return 'Hello, world!';
 *     }
 *   }
 * });
 * ```
 */
export function spawnPty(
  command: string,
  args: Array<string>,
  options?: SpawnPtyOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    const ptyData: Array<string> = [];

    const ptyProcess = spawn(command, args, {
      cwd: process.cwd(),
      encoding: 'utf-8',
      env: process.env
    });

    ptyProcess.onData((data) => {
      ptyData.push(data);
      if (options?.prompt) {
        const answer = options.prompt(data);
        if (answer) {
          ptyProcess.write(`${answer}\n`);
        }
      }
    });

    ptyProcess.onExit(({ exitCode }) => {
      const output = ptyData.join('');
      if (exitCode === 0) {
        resolve(output);
      } else {
        reject(
          new Error(`Process exited with code ${exitCode}\nOutput: ${output}`)
        );
      }
    });
  });
}
