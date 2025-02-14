import { exec as cpExec, execFile as cpExecFile } from 'child_process';
import { promisify } from 'util';

/**
 * Promisified version of the `exec` function from the `child_process` module.
 */
export const exec = promisify(cpExec);

/**
 * Promisified version of the `execFile` function from the `child_process` module.
 */
export const execFile = promisify(cpExecFile);
