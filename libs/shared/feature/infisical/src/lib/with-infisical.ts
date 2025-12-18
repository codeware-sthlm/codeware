import {
  InfisicalSDK,
  type Folder as SdkFolder,
  type Secret as SdkSecret
} from '@infisical/sdk';

import { Client, ClientSchema, type Environment } from './infisical.schemas';

/**
 * Custom Folder type with `relativePath` property.
 *
 * It's missing in the SDK types but returned by the API.
 */
export type Folder = SdkFolder & {
  /**
   * Relative path of the folder within the Infisical project,
   * to the path specified in the request.
   *
   * E.g.
   * - query secrets from /, folder is /apps/web -> relativePath: /apps/web
   * - query secrets from /apps, folder is /apps/web -> relativePath: /web
   */
  relativePath: string;
};

/**
 * Custom Secret type with `secretMetadata` as an array.
 *
 * It's different from the SDK type which defines it as a record,
 * but the API returns it as an array.
 */
export type Secret = Omit<SdkSecret, 'secretMetadata'> & {
  secretMetadata: Record<string, unknown>[];
};

/**
 * Maps SDK Folder to our Folder type.
 * Ensures the `relativePath` property is present.
 * @throws Error if `relativePath` is missing
 */
const mapFolder = (folder: SdkFolder): Folder => {
  if ('relativePath' in folder) {
    return folder as Folder;
  }
  throw new Error('Folder is missing relativePath property');
};

/**
 * Maps SDK Secret to our Secret type, handling the secretMetadata type difference.
 * SDK defines it as `Record<string, any>` but the API returns `Record<string, any>[]`.
 *
 * Ensures `secretMetadata` is always an array.
 */
const mapSecret = (secret: SdkSecret): Secret => {
  const { secretMetadata, ...rest } = secret;
  // Ensure secretMetadata is always an array
  const metadataArray =
    secretMetadata && Array.isArray(secretMetadata)
      ? secretMetadata
      : secretMetadata !== undefined
        ? [secretMetadata]
        : [];

  return {
    ...rest,
    secretMetadata: metadataArray
  };
};

/**
 * Merges multiple path segments into a single normalized path.
 */
const mergePaths = (...paths: (string | undefined)[]) =>
  paths.filter(Boolean).join('/').replace(/\/\/+/g, '/');

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
   * Whether to output progress details to the console.
   */
  debug?: boolean;

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
   * Take precedence over `INFISICAL_SITE` environment variable when provided.
   *
   * Defaults to `'us'`.
   */
  site?: 'eu' | 'us';

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
 * Environment variables as fallback for missing options:
 * - `INFISICAL_PROJECT_ID`
 * - `INFISICAL_SITE` (Infisical defaults to 'us')
 *
 * Credentials, either:
 * - `INFISICAL_CLIENT_ID`
 * - `INFISICAL_CLIENT_SECRET`
 *
 * or:
 * - `INFISICAL_SERVICE_TOKEN`
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
  // options take precedence when explicitly provided
  const optionsWithEnv: Client = {
    INFISICAL_CLIENT_ID:
      options?.clientId || process.env['INFISICAL_CLIENT_ID'] || '',
    INFISICAL_CLIENT_SECRET:
      options?.clientSecret || process.env['INFISICAL_CLIENT_SECRET'] || '',
    INFISICAL_PROJECT_ID:
      options?.projectId || process.env['INFISICAL_PROJECT_ID'] || '',
    INFISICAL_SERVICE_TOKEN: process.env['INFISICAL_SERVICE_TOKEN'],
    INFISICAL_SITE:
      options?.site ||
      (process.env['INFISICAL_SITE'] as Client['INFISICAL_SITE'])
  };

  const { success, data, error } = ClientSchema.safeParse(optionsWithEnv);
  const throwOnError = !options?.silent;

  const logDebug = (message: string) => {
    if (options?.debug) {
      console.log(`[Infisical][Debug]: ${message}`);
    }
  };

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
        data.INFISICAL_SITE === 'eu' ? 'https://eu.infisical.com' : undefined
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

    console.log(
      `[Infisical] connected successfully, load secrets${options?.filter?.recurse ? ' recursively' : ''}`
    );

    if (options?.groupByFolder) {
      logDebug('Grouping secrets by folder structure');

      const secretsBucket: FolderSecrets[] = [];

      logDebug(
        `Fetching folders from path: ${options?.filter?.path ?? '<default>'}`
      );

      const folders = (
        await client.folders().listFolders({
          environment,
          projectId: data.INFISICAL_PROJECT_ID,
          path: options?.filter?.path,
          recursive: true
        })
      ).map(mapFolder);

      logDebug(`Fetched ${folders.length} folders to analyze`);

      // Fetch secrets for each folder in parallel for efficiency
      await Promise.all(
        folders.map(async (folder) => {
          // Create full path when filtering by path
          const secretPath = mergePaths(
            options?.filter?.path,
            folder.relativePath
          );

          logDebug(`Fetching secrets from folder: ${secretPath}`);

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
            secrets: folderSecrets.map(mapSecret)
          });
        })
      );
      return secretsBucket as Response<TGroupByFolder, TSilent>;
    }

    logDebug(
      `Fetching secrets from path: ${options?.filter?.path ?? '<default>'}`
    );

    const secrets = await client.secrets().listSecretsWithImports({
      environment,
      projectId: data.INFISICAL_PROJECT_ID,
      attachToProcessEnv: options?.injectEnv ?? false,
      expandSecretReferences: true,
      recursive: options?.filter?.recurse ?? false,
      secretPath: options?.filter?.path,
      tagSlugs: options?.filter?.tags
    });

    logDebug(`Fetched ${secrets.length} secrets`);

    return secrets.map(mapSecret) as Response<TGroupByFolder, TSilent>;
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
