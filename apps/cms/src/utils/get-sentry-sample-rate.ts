/**
 * Get the Sentry sample rate based on the deployment environment.
 * - 100% in development
 * - 50% in preview
 * - 10% in production
 * - 0% otherwise
 *
 * @param deployEnv - The deployment environment (e.g., 'production', 'preview', etc.)
 * @returns The sample rate as a number between 0.0 and 1.0
 */
export const getSentrySampleRate = (deployEnv: string | undefined) =>
  deployEnv === 'production'
    ? 0.1
    : deployEnv === 'preview'
      ? 0.5
      : deployEnv === 'development'
        ? 1.0
        : 0.0;
