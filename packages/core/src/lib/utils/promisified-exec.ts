import { exec as cpExec } from 'child_process';
import { promisify } from 'util';

/**
 * Promisified version of the `exec` function from the `child_process` module.
 */
export const exec = promisify(cpExec);
