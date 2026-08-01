import { type Credentials, createClient } from './create-client';
import { type Environment } from './infisical.schemas';

type Options<TEnv> = Credentials & {
  /**
   * The environment to write the secret to.
   *
   * Defaults to `'development'`.
   */
  environment?: TEnv;

  /**
   * Folder-based path to the secret.
   *
   * Defaults to the root folder.
   */
  path?: string;

  /**
   * Name of the secret to write.
   */
  key: string;

  /**
   * Value to write.
   */
  value: string;
};

/**
 * Whether a rejected SDK call means the secret simply does not exist.
 *
 * The SDK rejects with the underlying axios error, so the status is the only
 * reliable signal.
 */
const isNotFound = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'response' in error &&
  (error as { response?: { status?: number } }).response?.status === 404;

export type SetSecretResult = {
  /** Whether the secret was created or an existing one was updated */
  action: 'created' | 'updated';
  key: string;
  path: string;
};

/**
 * Write a single secret to Infisical, creating it when it does not exist.
 *
 * Counterpart to `withInfisical`, which only reads. Credentials resolve the same
 * way, from options first and `INFISICAL_*` environment variables as fallback.
 *
 * The value is never logged - callers decide what to print.
 *
 * @returns Details of what was written
 * @throws An error if the credentials are invalid or the write fails
 */
export const setInfisicalSecret = async <TEnv = Environment>({
  environment,
  path = '/',
  key,
  value,
  ...credentials
}: Options<TEnv>): Promise<SetSecretResult> => {
  const { client, projectId } = await createClient(credentials);

  const secretOptions = {
    environment:
      environment?.toString() ?? ('development' satisfies Environment),
    projectId,
    secretPath: path
  };

  // Update first - the secret is expected to exist for a rotation.
  // Infisical has no upsert, so fall back to create only when it is missing.
  // Any other failure is a real one and must surface: masking it behind a
  // create would report a confusing "already exists" instead of the auth or
  // network error that actually happened.
  try {
    await client
      .secrets()
      .updateSecret(key, { ...secretOptions, secretValue: value });
    return { action: 'updated', key, path };
  } catch (error) {
    if (!isNotFound(error)) {
      throw error;
    }
  }

  await client
    .secrets()
    .createSecret(key, { ...secretOptions, secretValue: value });
  return { action: 'created', key, path };
};
