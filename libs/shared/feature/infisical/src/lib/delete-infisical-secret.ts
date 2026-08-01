import { type Credentials, createClient } from './create-client';
import { type Environment } from './infisical.schemas';

type Options<TEnv> = Credentials & {
  /**
   * The environment to delete the secret from.
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
   * Name of the secret to delete.
   */
  key: string;
};

/**
 * Delete a single secret from Infisical.
 *
 * Used to retire a secret once a rollover has completed. Deleting one that does
 * not exist is not an error - the desired end state is the same either way.
 *
 * @returns `true` when a secret was deleted, `false` when there was none
 * @throws An error if the credentials are invalid or the delete fails
 */
export const deleteInfisicalSecret = async <TEnv = Environment>({
  environment,
  path = '/',
  key,
  ...credentials
}: Options<TEnv>): Promise<boolean> => {
  const { client, projectId } = await createClient(credentials);

  try {
    await client.secrets().deleteSecret(key, {
      environment:
        environment?.toString() ?? ('development' satisfies Environment),
      projectId,
      secretPath: path
    });
    return true;
  } catch {
    return false;
  }
};
