import { ChildProcess, spawn } from 'child_process';

interface WaitForDockerLogMatchOptions {
  containerName: string;
  matchString: string;
  timeoutSeconds?: number;
}

/**
 * Listen to Docker logs and let this function resolved
 * once the provided match string is detected.
 */
export const waitForDockerLogMatch = ({
  containerName,
  matchString,
  timeoutSeconds = 30
}: WaitForDockerLogMatchOptions): Promise<boolean> => {
  return new Promise<boolean>((resolve, reject) => {
    const dockerProcess: ChildProcess = spawn('docker', [
      'logs',
      '-f',
      containerName
    ]);

    const cleanup = (): void => {
      clearTimeout(timer);
      dockerProcess.kill();
    };

    const checkLog = (chunk: Buffer): void => {
      if (chunk.toString().includes(matchString)) {
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
      reject(
        new Error(
          `Timeout waiting for log match in container '${containerName}'`
        )
      );
    }, timeoutSeconds * 1000);
  });
};
