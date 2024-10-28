import * as exec from '@actions/exec';

// Reset all files affected by the tests (keep the commit)
export const revertToLatestGitCommit = async (): Promise<void> => {
  await exec.exec('git', ['reset', '--hard', 'HEAD']);
};
