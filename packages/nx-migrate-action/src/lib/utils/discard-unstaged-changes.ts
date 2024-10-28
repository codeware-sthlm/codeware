import * as exec from '@actions/exec';

/**
 * Discard any unstaged changes in the workspace.
 */
export const discardUnstagedChanges = async (): Promise<void> => {
  await exec.exec('git', ['checkout', '--', '.']);
};
