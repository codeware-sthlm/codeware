import { InfisicalSDK } from '@infisical/sdk';

import {
  type Client,
  ClientSchema,
  type Environment
} from './infisical.schemas';

type Options<TEnv> = {
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

  /**
   * Infisical client ID for authentication.
   *
   * Takes precedence over `INFISICAL_CLIENT_ID` environment variable when provided.
   */
  clientId?: string;

  /**
   * Infisical client secret for authentication.
   *
   * Takes precedence over `INFISICAL_CLIENT_SECRET` environment variable when provided.
   */
  clientSecret?: string;

  /**
   * Infisical project ID.
   *
   * Takes precedence over `INFISICAL_PROJECT_ID` environment variable when provided.
   */
  projectId?: string;

  /**
   * The site to use for the Infisical client.
   *
   * Takes precedence over `INFISICAL_SITE` environment variable when provided.
   *
   * Defaults to `'us'`.
   */
  site?: 'eu' | 'us';
};

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
  clientId,
  clientSecret,
  projectId,
  site
}: Options<TEnv>): Promise<SetSecretResult> => {
  const optionsWithEnv: Client = {
    INFISICAL_CLIENT_ID: clientId || process.env['INFISICAL_CLIENT_ID'] || '',
    INFISICAL_CLIENT_SECRET:
      clientSecret || process.env['INFISICAL_CLIENT_SECRET'] || '',
    INFISICAL_PROJECT_ID:
      projectId || process.env['INFISICAL_PROJECT_ID'] || '',
    INFISICAL_SERVICE_TOKEN: process.env['INFISICAL_SERVICE_TOKEN'],
    INFISICAL_SITE:
      site || (process.env['INFISICAL_SITE'] as Client['INFISICAL_SITE'])
  };

  const { success, data, error } = ClientSchema.safeParse(optionsWithEnv);

  if (!success) {
    throw new Error('Could not resolve Infisical credentials', {
      cause: error.flatten().fieldErrors
    });
  }

  const client = new InfisicalSDK({
    siteUrl:
      data.INFISICAL_SITE === 'eu' ? 'https://eu.infisical.com' : undefined
  });

  if ('INFISICAL_SERVICE_TOKEN' in data) {
    client.auth().accessToken(data.INFISICAL_SERVICE_TOKEN);
  } else {
    await client.auth().universalAuth.login({
      clientId: data.INFISICAL_CLIENT_ID,
      clientSecret: data.INFISICAL_CLIENT_SECRET
    });
  }

  const secretOptions = {
    environment:
      environment?.toString() ?? ('development' satisfies Environment),
    projectId: data.INFISICAL_PROJECT_ID,
    secretPath: path
  };

  // Update first - the secret is expected to exist for a rotation.
  // Infisical has no upsert, so fall back to create when it is missing.
  try {
    await client
      .secrets()
      .updateSecret(key, { ...secretOptions, secretValue: value });
    return { action: 'updated', key, path };
  } catch {
    await client
      .secrets()
      .createSecret(key, { ...secretOptions, secretValue: value });
    return { action: 'created', key, path };
  }
};
