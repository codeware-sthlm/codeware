import { SignalConstants } from 'os';
import { promisify } from 'util';

import treeKill from 'tree-kill';

/**
 * Kill all the descendent processes of the process pid,
 * including the process pid itself.
 */
export const killProcessTree: (
  pid: number,
  signal: keyof SignalConstants
) => Promise<void> = promisify(treeKill);
