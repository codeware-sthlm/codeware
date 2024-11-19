import * as exec from '@actions/exec';

/**
 * Get the current/last commit sha
 * @returns Current sha
 */
export const getCurrentCommitSha = async (): Promise<string> => {
  let sha = '';
  const options = {
    listeners: {
      stdout: (data: Buffer) => {
        sha += data.toString();
      }
    }
  };

  await exec.exec('git', ['rev-parse', 'HEAD'], options);
  return sha.trim();
};
