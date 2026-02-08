import { Env, EnvSchema } from '@codeware/app-cms/util/env-schema';

/**
 * Get the environment variables.
 *
 * @param assert - Whether to throw an error if the environment variables are invalid (default: `true`).
 * @returns The environment variables or `undefined`.
 * @throws If `assert` is `true` and the environment variables are invalid.
 */
export function getEnv(assert?: boolean): Env;
export function getEnv(assert: false): Env | undefined;
export function getEnv(assert?: boolean): Env | undefined {
  const parsed = EnvSchema.safeParse(process.env);

  if (parsed.success) {
    return parsed.data;
  }

  if (assert === undefined || assert) {
    throw new Error(
      `Invalid environment variables: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`
    );
  }

  return parsed.data;
}
