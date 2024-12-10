import { InfisicalSDK } from '@infisical/sdk';

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
   * The action to perform when the client is authenticated.
   *
   * **`inject`**
   *
   * Get the secrets from your project and inject them into the `process.env` object.
   * Use early in your application to ensure that the secrets are available as soon as possible.
   */
  onConnect?: 'inject';
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
 * Utility function to connect and authenticate to Infisical.
 *
 * **Requirements:**
 *
 * - `INFISICAL_CLIENT_ID` and `INFISICAL_CLIENT_SECRET` must be available in the environment variables.
 * - A project ID, either from `options` or the Infisical configuration file `.infisical.json`.
 *
 * @returns The authenticated Infisical SDK client
 * @throws An error if the environment variables are invalid or the client fails to authenticate
 */
export const withInfisical = async <TEnv = Environment>(
  options?: Options<TEnv>
): Promise<InfisicalSDK | null> => {
  const { success, data, error } = ClientSchema.safeParse(process.env);

  if (!success) {
    const msg = 'Could not resolve client credentials';
    if (!options?.silent) {
      throw new Error(msg, {
        cause: error.flatten().fieldErrors
      });
    }

    console.warn(msg);
    console.warn(JSON.stringify(error.flatten().fieldErrors, null, 2));
    return null;
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
    const ref = await client.auth().universalAuth.login({
      clientId,
      clientSecret
    });

    console.log('[Infisical] connected successfully');

    // Action to perform when the client is authenticated
    switch (options?.onConnect) {
      case 'inject': {
        const { secrets } = await client.secrets().listSecrets({
          environment,
          projectId,
          expandSecretReferences: true,
          recursive: options?.filter?.recurse ?? false,
          secretPath: options?.filter?.path,
          tagSlugs: options?.filter?.tags
        });
        console.log(
          `[Infisical] inject ${secrets.length} secrets into process.env`
        );
        for (const { secretKey, secretValue } of secrets) {
          process.env[secretKey] = secretValue;
          console.log(`[Infisical] injected '${secretKey}'`);
        }
        console.log('process.env', process.env);
        break;
      }
      default:
        break;
    }

    return ref;
  } catch (error) {
    if (!options?.silent) {
      throw error;
    }

    console.error('Failed to initialize Infisical SDK');

    if (error instanceof Error) {
      console.error(error.message);
      if (error.cause) {
        console.error(error.cause);
      }
    }

    return null;
  }
};
