import * as core from '@actions/core';
import * as exec from '@actions/exec';

/**
 * Stage all changes in the workspace.
 */
export const stageAllChanges = async (): Promise<void> => {
  await exec.exec('git', ['add', '.']);

  core.info('All changes was staged');
};
