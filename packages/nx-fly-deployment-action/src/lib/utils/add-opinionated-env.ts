/**
 * Add opinionated environment variables to the environment
 *
 * - `APP_NAME`
 * - `PR_NUMBER`
 *
 * @param appName - The name of the app
 * @param prNumber - The pull request number
 * @param env - The current environment variables to append to
 * @returns The environment variables with the opinionated environment variables added
 */
export const addOpinionatedEnv = (
  { appName, prNumber }: { appName: string; prNumber?: number },
  env?: Record<string, string>
): Record<string, string> => {
  return {
    ...env,
    APP_NAME: appName,
    PR_NUMBER: String(prNumber ?? '')
  };
};
