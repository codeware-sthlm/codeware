import { InfisicalSDK, ListSecretsResult } from '@infisical/sdk';

import { ClientSchema, type Environment } from './infisical.schemas';

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
 * - `INFISICAL_CLIENT_ID`, `INFISICAL_CLIENT_SECRET` and `INFISICAL_PROJECT_ID` must be available in the environment variables.
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
    if (!options?.silent) {
      throw new Error('Could not resolve Infisical credentials', {
        cause: error.flatten().fieldErrors
      });
    }
    return null as Response<TSilent>;
  }

  try {
    const environment: string =
      options?.environment?.toString() ?? ('development' satisfies Environment);

    // Default site is US
    const client = new InfisicalSDK({
      siteUrl: options?.site === 'eu' ? 'https://eu.infisical.com' : undefined
    });

    // Connect to Infisical using service token or universal auth
    if ('INFISICAL_SERVICE_TOKEN' in data) {
      client.auth().accessToken(data.INFISICAL_SERVICE_TOKEN);
    } else {
      await client.auth().universalAuth.login({
        clientId: data.INFISICAL_CLIENT_ID,
        clientSecret: data.INFISICAL_CLIENT_SECRET
      });
    }

    console.log('[Infisical] connected successfully, load secrets');

    const { secrets } = await client.secrets().listSecrets({
      environment,
      projectId: data.INFISICAL_PROJECT_ID,
      expandSecretReferences: true,
      recursive: options?.filter?.recurse ?? false,
      secretPath: options?.filter?.path,
      tagSlugs: options?.filter?.tags
    });

    // Post-actions to perform after the secrets are retrieved
    if (options?.injectEnv) {
      for (const { secretKey, secretValue } of secrets) {
        console.log(`[Infisical] inject '${secretKey}'`);
        process.env[secretKey] = secretValue;
      }
    }

    return secrets;
  } catch (error) {
    if (!options?.silent) {
      throw error;
    }

    if (error instanceof Error) {
      console.error(error.message);
      if (error.cause) {
        console.info(error.cause);
      }
    }

    return null as Response<TSilent>;
  }
};
