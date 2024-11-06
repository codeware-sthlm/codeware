import { killPort } from './kill-port';
import { killProcessTree } from './kill-process-tree';

export async function killProcessAndPorts(
  pid: number | undefined,
  ports?: Array<number>
): Promise<void> {
  if (pid) {
    await killProcessTree(pid, 'SIGKILL');
  }

  for (const port of ports ?? []) {
    await killPort(port);
  }
}
