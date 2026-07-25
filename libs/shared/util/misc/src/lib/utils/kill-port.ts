import kill from 'kill-port';
import { check as portCheck } from 'tcp-port-used';

import { logError, logInfo, logSuccess } from './log-utils';

const KILL_PORT_DELAY = 5000;

/**
 * Experimental: Attempt to close a port
 *
 * @param port Port number
 * @returns `true` if port is closed, `false` otherwise
 */
export async function killPort(
  port: number,
  options?: { delay?: number; verbose?: boolean }
): Promise<boolean> {
  const delay = options?.delay ?? KILL_PORT_DELAY;
  const verbose = options?.verbose;

  if (await portCheck(port)) {
    let killPortResult;
    try {
      if (verbose) {
        logInfo(`Attempting to close port ${port}`);
      }
      killPortResult = await kill(port);
      await new Promise<void>((resolve) => setTimeout(() => resolve(), delay));
      if (await portCheck(port)) {
        logError(`Port ${port} still open`, JSON.stringify(killPortResult));
      } else {
        if (verbose) {
          logSuccess(`Port ${port} successfully closed`);
        }
        return true;
      }
    } catch {
      logError(`Port ${port} closing failed`);
    }
    return false;
  } else {
    return true;
  }
}
