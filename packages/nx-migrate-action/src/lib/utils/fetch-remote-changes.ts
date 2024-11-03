import * as exec from '@actions/exec';

/**
 * Fetch latest changes on remote
 */
export const fetchRemoteChanges = async () =>
  await exec.exec('git', ['fetch', 'origin']);
