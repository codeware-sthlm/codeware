import { Context } from '@actions/github/lib/context';
import { z } from 'zod';

export const EnvironmentSchema = z.enum(['preview', 'production']);

export type Environment = z.infer<typeof EnvironmentSchema>;

/**
 * Get the environment to use for deployment.
 *
 * When the environment is null, a reason is also provided.
 *
 * @param context GitHub context
 * @param mainBranch Main branch
 * @returns Environment to use for deployment or null if unsupported
 */
export const getDeployEnv = (
  context: Context,

  mainBranch: string
): { environment: Environment } | { environment: null; reason: string } => {
  const { eventName, ref } = context;

  const currentBranch = ref.split('/').at(-1);

  if (eventName === 'pull_request') {
    return { environment: 'preview' };
  }

  if (eventName === 'push') {
    if (currentBranch === mainBranch) {
      return { environment: 'production' };
    }

    return {
      environment: null,
      reason: `'${currentBranch}' is not supported for production deployment, only '${mainBranch}' is supported`
    };
  }

  return {
    environment: null,
    reason: `'${eventName}' is not a supported event for deployment, only 'pull_request' and 'push' are supported`
  };
};
