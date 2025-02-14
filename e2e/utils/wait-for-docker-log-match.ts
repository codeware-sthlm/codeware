import { ChildProcess, spawn } from 'child_process';

import { logDebug } from '@codeware/core/utils';

type WaitForDockerLogMatchOptions = {
  /** The name of the container to listen to */
  containerName: string;

  /** The match to wait for to resolve successfully */
  match: RegExp | string;

  /**
   * The timeout in seconds before rejecting with an error
   * @default 30
   */
  timeoutSeconds?: number;
};

/**
 * Listen to Docker container logs and resolve once the provided match is detected.
 *
 * Otherwise, reject with an error after the timeout.
 */
export const waitForDockerLogMatch = ({
  containerName,
  match,
  timeoutSeconds = 30
}: WaitForDockerLogMatchOptions): Promise<boolean> => {
  return new Promise<boolean>((resolve, reject) => {
    const dockerProcess: ChildProcess = spawn('docker', [
      'logs',
      '-f',
      containerName
    ]);

    const buffer: Buffer[] = [];
    const cleanup = (): void => {
      clearTimeout(timer);
      dockerProcess.kill();
    };

    const checkLog = (chunk: Buffer): void => {
      buffer.push(chunk);
      if (
        typeof match === 'string'
          ? chunk.toString().includes(match)
          : match.test(chunk.toString())
      ) {
        cleanup();
        resolve(true);
      }
    };

    dockerProcess.stdout?.on('data', checkLog);
    dockerProcess.stderr?.on('data', checkLog);

    dockerProcess.on('error', (error: Error) => {
      cleanup();
      reject(new Error(`Docker process error: ${error.message}`));
    });

    dockerProcess.on('close', (code: number | null) => {
      if (code !== null && code !== 0) {
        cleanup();
        reject(new Error(`Docker process exited with code ${code}`));
      }
    });

    const timer = setTimeout(() => {
      cleanup();
      logDebug('Docker log', buffer.join(''));
      reject(
        new Error(
          `Timeout waiting for log match in container '${containerName}'`
        )
      );
    }, timeoutSeconds * 1000);
  });
};
