import { InfisicalSDK, ListSecretsResult } from '@infisical/sdk';

import { ClientSchema, type Environment } from './infisical.schemas';
import { readInfisicalConfig } from './read-infisical-config';

type Filter = {
  /**
   * Folder-based path to the secrets.
   *
   * Defaults to the root folder.
   */
  path?: string;
  /**
   * Whether to recurse into subfolders.
   *
   * Defaults to `false`.
   */
  recurse?: boolean;
  /**
   * Tags to filter the secrets by.
   */
  tags?: Array<string>;
};

type Options<TEnv> = {
  /**
   * The environment to get the secrets from.
   *
   * Defaults to the environment in the Infisical configuration file
   * or 'development' if not available.
   */
  environment?: TEnv;
  /**
   * The optional filters to apply to the secrets.
   */
  filter?: Filter;
  /**
   * Whether to inject the secrets into the `process.env` object.
   *
   * Defaults to `false`.
   */
  injectEnv?: boolean;
  /**
   * The project ID to get the secrets from.
   *
   * Defaults to the project ID in the Infisical configuration file.
   */
  projectId?: string;
  /**
   * Whether to ignore exceptions and just output warnings.
   *
   * Defaults to `false`.
   */
  silent?: boolean;
  /**
   * The site to use for the Infisical client.
   *
   * Defaults to `'us'`.
   */
  site?: 'eu' | 'us';
};

/**
 * Helper type to determine return type based on silent option
 */
type Response<TSilent extends boolean | undefined> = TSilent extends true
  ? ListSecretsResult['secrets'] | null
  : ListSecretsResult['secrets'];

/**
 * Utility function to connect and authenticate to Infisical.
 *
 * **Requirements:**
 *
 * - `INFISICAL_CLIENT_ID` and `INFISICAL_CLIENT_SECRET` must be available in the environment variables.
 * - A project ID, either from `options` or the Infisical configuration file `.infisical.json`.
 *
 * @returns The secrets from the Infisical project
 * @throws An error if the environment variables are invalid or the client fails to authenticate
 */
export const withInfisical = async <
  TEnv = Environment,
  TSilent extends boolean | undefined = undefined
>(
  options?: Options<TEnv> & { silent?: TSilent }
): Promise<Response<TSilent>> => {
  const { success, data, error } = ClientSchema.safeParse(process.env);

  if (!success) {
    const msg = 'Could not resolve Infisical client credentials';
    if (!options?.silent) {
      throw new Error(msg, {
        cause: error.flatten().fieldErrors
      });
    }

    console.info(msg);
    return null as Response<TSilent>;
  }

  const {
    INFISICAL_CLIENT_ID: clientId,
    INFISICAL_CLIENT_SECRET: clientSecret
  } = data;

  try {
    const environment: string =
      options?.environment?.toString() ?? ('development' satisfies Environment);
    console.log(`[Infisical] use environment '${environment}'`);

    const projectId =
      options?.projectId ?? (await readInfisicalConfig()).workspaceId;
    console.log(`[Infisical] use project '${projectId}'`);

    // Default site is US
    const client = new InfisicalSDK({
      siteUrl: options?.site === 'eu' ? 'https://eu.infisical.com' : undefined
    });

    // Connect to Infisical
    await client.auth().universalAuth.login({
      clientId,
      clientSecret
    });

    console.log('[Infisical] connected successfully, load secrets');

    const { secrets } = await client.secrets().listSecrets({
      environment,
      projectId,
      expandSecretReferences: true,
      recursive: options?.filter?.recurse ?? false,
      secretPath: options?.filter?.path,
      tagSlugs: options?.filter?.tags
    });

    // Post-actions to perform after the secrets are retrieved
    if (options?.injectEnv) {
      console.log(
        `[Infisical] inject ${secrets.length} secrets into process.env`
      );
      for (const { secretKey, secretValue } of secrets) {
        process.env[secretKey] = secretValue;
        console.log(`[Infisical] injected '${secretKey}'`);
      }
    }

    return secrets;
  } catch (error) {
    if (!options?.silent) {
      throw error;
    }

    console.error('Failed to initialize Infisical SDK');

    if (error instanceof Error) {
      console.error(error.message);
      if (error.cause) {
        console.info(error.cause);
      }
    }

    return null as Response<TSilent>;
  }
};
