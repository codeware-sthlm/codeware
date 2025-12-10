import { InfisicalSDK, type Secret } from '@infisical/sdk';

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

type Options<TEnv, TGroupByFolder, TSilent> = {
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
   * Whether to group the secrets by their folder structure.
   *
   * Defaults to `false`.
   */
  groupByFolder?: TGroupByFolder;

  /**
   * Whether to inject the secrets into the `process.env` object.
   *
   * Defaults to `false`.
   */
  injectEnv?: boolean;

  /**
   * Hook that provides the authenticated Infisical client instance.
   */

  onConnect?: (client: InfisicalSDK) => void;

  /**
   * Whether to ignore exceptions and just output warnings.
   *
   * Defaults to `false`.
   */
  silent?: TSilent;

  /**
   * The site to use for the Infisical client.
   *
   * Environment variable `INFISICAL_SITE` takes precedence over this option.
   *
   * Defaults to `'us'`.
   */
  site?: 'eu' | 'us';
};

export type FolderSecrets = {
  path: string;
  secrets: Secret[];
};

// Helper types to determine return type based on groupByFolder and silent options
type SecretResponse<TGroupByFolder extends boolean | undefined> =
  TGroupByFolder extends true ? FolderSecrets[] : Secret[];
type Response<
  TGroupByFolder extends boolean | undefined,
  TSilent extends boolean | undefined
> = TSilent extends true
  ? SecretResponse<TGroupByFolder> | null
  : SecretResponse<TGroupByFolder>;

/**
 * Utility function to connect and authenticate to Infisical
 * and return the secrets of choice.
 *
 * Required environment variables:
 * - `INFISICAL_PROJECT_ID`
 *
 * Credentials, either (recommended):
 * - `INFISICAL_CLIENT_ID`
 * - `INFISICAL_CLIENT_SECRET`
 *
 * or:
 * - `INFISICAL_SERVICE_TOKEN`
 *
 * Optional:
 * - `INFISICAL_SITE` (Infisical defaults to 'us')
 *
 * @returns The secrets from the Infisical project
 * @throws An error if the environment variables are invalid or the client fails to authenticate
 */
export const withInfisical = async <
  TEnv = Environment,
  TGroupByFolder extends boolean | undefined = undefined,
  TSilent extends boolean | undefined = undefined
>(
  options?: Options<TEnv, TGroupByFolder, TSilent>
): Promise<Response<TGroupByFolder, TSilent>> => {
  const { success, data, error } = ClientSchema.safeParse(process.env);
  const throwOnError = !options?.silent;

  if (!success) {
    if (throwOnError) {
      throw new Error('Could not resolve Infisical credentials', {
        cause: error.flatten().fieldErrors
      });
    }
    return null as Response<TGroupByFolder, TSilent>;
  }

  try {
    const environment: string =
      options?.environment?.toString() ?? ('development' satisfies Environment);

    // Default site is US
    const client = new InfisicalSDK({
      siteUrl:
        (data.INFISICAL_SITE || options?.site) === 'eu'
          ? 'https://eu.infisical.com'
          : undefined
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

    // Invoke hook if provided
    options?.onConnect?.(client);

    console.log('[Infisical] connected successfully, load secrets');

    if (options?.groupByFolder) {
      const secretsBucket: FolderSecrets[] = [];

      const folders = await client.folders().listFolders({
        environment,
        projectId: data.INFISICAL_PROJECT_ID,
        path: options?.filter?.path,
        recursive: true
      });

      // Fetch secrets for each folder in parallel for efficiency
      await Promise.all(
        folders.map(async (folder) => {
          // Use relativePath from the folder response
          const secretPath = (
            'relativePath' in folder ? folder.relativePath : `/${folder.name}`
          ) as string;

          const folderSecrets = await client.secrets().listSecretsWithImports({
            environment,
            projectId: data.INFISICAL_PROJECT_ID,
            attachToProcessEnv: options?.injectEnv ?? false,
            expandSecretReferences: true,
            recursive: options?.filter?.recurse ?? false,
            secretPath,
            tagSlugs: options?.filter?.tags
          });

          secretsBucket.push({
            path: secretPath,
            secrets: folderSecrets
          });
        })
      );
      return secretsBucket as Response<TGroupByFolder, TSilent>;
    }

    const secrets = await client.secrets().listSecretsWithImports({
      environment,
      projectId: data.INFISICAL_PROJECT_ID,
      attachToProcessEnv: options?.injectEnv ?? false,
      expandSecretReferences: true,
      recursive: options?.filter?.recurse ?? false,
      secretPath: options?.filter?.path,
      tagSlugs: options?.filter?.tags
    });

    return secrets as Response<TGroupByFolder, TSilent>;
  } catch (error) {
    if (throwOnError) {
      throw error;
    }

    if (error instanceof Error) {
      console.error(error.message);
      if (error.cause) {
        console.info(error.cause);
      }
    }

    return null as Response<TGroupByFolder, TSilent>;
  }
};
