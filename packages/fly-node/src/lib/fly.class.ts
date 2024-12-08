import { existsSync } from 'fs';
import { join } from 'path';
import { cwd } from 'process';

import { exec } from '@codeware/core/utils';
import { ZodError } from 'zod';

import { AppsCreateTransformedResponseSchema } from './schemas/apps-create.schema';
import { AppsListTransformedResponseSchema } from './schemas/apps-list.schema';
import { CertsListWithAppTransformedResponseSchema } from './schemas/certs-list-with-app.schema';
import { CertsListTransformedResponseSchema } from './schemas/certs-list.schema';
import { ConfigShowResponseSchema } from './schemas/config-show.schema';
import { DeployResponseSchema } from './schemas/deploy.schema';
import { NameSchema } from './schemas/helper-schemas';
import { SecretsListWithAppTransformedResponseSchema } from './schemas/secrets-list-with-app.schema';
import { SecretsListTransformedResponseSchema } from './schemas/secrets-list.schema';
import { StatusExtendedTransformedResponseSchema } from './schemas/status-extended.schema';
import { StatusTransformedResponseSchema } from './schemas/status.schema';
import type {
  AppOrConfig,
  Config,
  CreateAppOptions,
  CreateAppResponse,
  DeployAppOptions,
  DeployResponse,
  ListAppResponse,
  ListCertForAllResponse,
  ListCertForAppResponse,
  ListSecretForAllResponse,
  ListSecretForAppResponse,
  Logger,
  SetAppSecretsOptions,
  ShowConfigOptions,
  ShowConfigResponse,
  StatusExtendedResponse,
  StatusResponse,
  UnsetAppSecretsOptions
} from './types';

/**
 * Manages deployments to Fly.io using the `flyctl` CLI tool.
 */
export class Fly {
  /** Use underscore to avoid conflict with public `config` property */
  private _config: Config;
  /**
   * Whether a user is authenticated via local login.
   * In this case a token is not needed, though it can still have been provided.
   */
  private authByLogin = false;
  private initialized = false;
  private logger: Logger;

  /**
   * Get the app name from the instance config
   */
  private get instanceApp(): string {
    if ('app' in this._config) {
      return this._config.app ?? '';
    }
    return '';
  }
  /**
   * Get the config file path from the instance config
   */
  private get instanceConfig(): string {
    if ('config' in this._config) {
      return this._config.config ?? '';
    }
    return '';
  }

  constructor(config?: Config) {
    this._config = config || {};
    this.logger = {
      info: config?.logger?.info || console.log,
      error: config?.logger?.error || console.error,
      traceCLI: config?.logger?.traceCLI || false
    };

    // Fall back to env token
    if (!this._config.token) {
      this._config.token = process.env['FLY_API_TOKEN'] || '';
    }
  }

  /**
   * Verify that the Fly client is ready to use.
   *
   * This means that the Fly CLI is installed and authenticated to Fly.io.
   *
   * Use as ad-hoc check when needed instead of waiting for the first Fly command to run.
   *
   * @param mode - Whether to use assertion mode instead of returning `false`
   * @returns `true` if the Fly client is ready, `false` otherwise
   * @throws An error in assertion mode if the Fly client is not ready
   */
  async isReady(mode?: 'assert'): Promise<boolean> {
    try {
      await this.ensureInitialized();
      return true;
    } catch (error) {
      if (mode === 'assert') {
        throw error;
      }
      this.logger.info(`Fly client is not ready\n${error}`);
      return false;
    }
  }

  /**
   * Manage the Fly CLI tool
   */
  cli = {
    /**
     * Check if the Fly CLI tool is installed
     *
     * @returns `true` if the Fly CLI tool is installed, `false` otherwise
     */
    isInstalled: async (): Promise<boolean> => await this.isInstalled()
  };

  //
  // External API following the `flyctl` CLI commands structure
  //

  /**
   * Manage apps
   */
  apps = {
    /**
     * Create a new application with a generated name when not provided.
     *
     * @param options - Options for creating an application
     * @returns The name of the created application
     * @throws An error if the application cannot be created
     */
    create: async (options?: CreateAppOptions): Promise<string> => {
      try {
        await this.ensureInitialized();
        const { name } = await this.createApp(options);
        this.logger.info(`Application '${name}' was created`);
        return name;
      } catch (error) {
        throw new Error(
          `[create app] something broke, check your apps\n${error}`
        );
      }
    },
    /**
     * Destroy an application completely
     *
     * @param app - The name of the app to destroy
     * @param force - Whether to force the destruction
     * @throws An error if the app cannot be destroyed
     */
    destroy: async (app: string, force = false): Promise<void> => {
      try {
        await this.ensureInitialized();
        await this.destroyApp(app, force);
        this.logger.info(`Application '${app}' was destroyed`);
      } catch (error) {
        throw new Error(
          `[destroy app] something broke, check your apps\n${error}`
        );
      }
    },
    /**
     * List all applications
     *
     * @returns A list of applications
     * @throws An error if listing applications fails
     */
    list: async (): Promise<Array<ListAppResponse>> => {
      try {
        return await this.getAllApps('throwOnError');
      } catch (error) {
        throw new Error(`[list] something broke\n${error}`);
      }
    }
  };
  /**
   * Manage certificates
   */
  certs = {
    /**
     * Add a certificate for a domain to an application
     *
     * @param hostname - The hostname to add a certificate for
     * @param options - Options for adding a certificate
     * @throws An error if the certificate cannot be added
     */
    add: async (hostname: string, options?: AppOrConfig): Promise<void> => {
      try {
        await this.ensureInitialized();
        const appName = await this.addAppCertificate(hostname, options);
        this.logger.info(
          `Certificate for domain '${hostname}' was added to '${appName}'`
        );
      } catch (error) {
        throw new Error(
          `[add certificate] something broke, check your app certificates\n${error}`
        );
      }
    },
    /**
     * List certificates for an application
     *
     * @param options - List certificates for an application or all certificates
     * @returns A list of certificates
     * @throws An error if listing certificates fails
     */
    list: async <T extends AppOrConfig | 'all'>(
      options?: T
    ): Promise<
      T extends 'all'
        ? Array<ListCertForAllResponse>
        : Array<ListCertForAppResponse>
    > => {
      try {
        await this.ensureInitialized();

        // Note!
        // A typesafe pattern to let us keep object literals with methods, with great DX,
        // but which also prevents us from using functions overload.
        const result =
          options === 'all'
            ? await this.getAllCerts('throwOnError')
            : await this.getAppCerts('throwOnError', options);

        return result as T extends 'all'
          ? Array<ListCertForAllResponse>
          : Array<ListCertForAppResponse>;
      } catch (error) {
        throw new Error(`[list certificates] something broke\n${error}`);
      }
    },
    /**
     * Remove a certificate for a domain from an application
     *
     * @param hostname - The hostname to remove a certificate for
     * @param options - Options for removing a certificate
     * @throws An error if the certificate cannot be removed
     */
    remove: async (hostname: string, options?: AppOrConfig): Promise<void> => {
      try {
        await this.ensureInitialized();
        const appName = await this.removeAppCertificate(hostname, options);
        this.logger.info(
          `Certificate for domain '${hostname}' was removed from '${appName}'`
        );
      } catch (error) {
        throw new Error(
          `[remove certificate] something broke, check your app certificates\n${error}`
        );
      }
    }
  };
  /**
   * Manage an app's configuration
   */
  config = {
    /**
     * Show an application's configuration.
     *
     * @param options - Options for showing an application's configuration
     * @returns The application's JSON configuration
     * @throws An error if the configuration cannot be found or parsed
     */
    show: async (options?: ShowConfigOptions): Promise<ShowConfigResponse> => {
      try {
        await this.ensureInitialized();
        return await this.showConfig('throwOnError', options);
      } catch (error) {
        throw new Error(`[show config] something broke\n${error}`);
      }
    }
  };
  /**
   * Deploy an application.
   *
   * A valid config file is required but the app doesn't have to exist,
   * since it gets created if needed.
   *
   * The app name is selected from:
   * 1. Provided app name
   * 2. Instance app name
   * 3. App name from the provided config file
   *
   * Existing secrets are preserved.
   *
   * @param options - Options for deploying an application
   * @throws An error if the deployment fails
   */
  deploy = async (options?: DeployAppOptions): Promise<DeployResponse> => {
    try {
      await this.ensureInitialized();
      const appName = await this.deployApp(options);

      this.logger.info(`Application '${appName}' was deployed`);

      const status = await this.getAppStatus('throwOnError', {
        app: appName
      });

      return DeployResponseSchema.parse({
        app: status.name,
        hostname: status.hostname,
        url: `https://${status.hostname}`
      });
    } catch (error) {
      throw new Error(
        `[deploy] something broke, check your deployments\n${error}`
      );
    }
  };
  /**
   * Manage application secrets
   */
  secrets = {
    /**
     * Set secrets for an application
     *
     * @param secrets - The secrets to set
     * @param options - Options for setting secrets
     * @throws An error if the secrets cannot be set
     */
    set: async (
      secrets: Record<string, string>,
      options?: SetAppSecretsOptions
    ): Promise<void> => {
      try {
        await this.ensureInitialized();
        const appName = await this.setAppSecrets(secrets, options);
        const keys = Object.keys(secrets);
        this.logger.info(
          `Secrets were set for '${appName}': ${keys.join(', ')}`
        );
      } catch (error) {
        throw new Error(
          `[set secrets] something broke, check your app secrets\n${error}`
        );
      }
    },
    /**
     * List secrets for an application
     *
     * @param options - List secrets for an application or all secrets
     * @returns A list of secrets
     * @throws An error if listing secrets fails
     */
    list: async <T extends AppOrConfig | 'all'>(
      options?: T
    ): Promise<
      T extends 'all'
        ? Array<ListSecretForAllResponse>
        : Array<ListSecretForAppResponse>
    > => {
      try {
        await this.ensureInitialized();

        const result =
          options === 'all'
            ? await this.getAllSecrets('throwOnError')
            : await this.getAppSecrets('throwOnError', options);

        return result as T extends 'all'
          ? Array<ListSecretForAllResponse>
          : Array<ListSecretForAppResponse>;
      } catch (error) {
        throw new Error(`[list secrets] something broke\n${error}`);
      }
    },
    /**
     * Unset secrets for an application
     *
     * @param keys - The keys to unset
     * @param options - Options for unsetting secrets
     * @throws An error if the secrets cannot be unset
     */
    unset: async (
      keys: string | Array<string>,
      options?: UnsetAppSecretsOptions
    ): Promise<void> => {
      try {
        await this.ensureInitialized();

        const keysArray = Array.isArray(keys) ? keys : [keys];
        const appName = await this.unsetAppSecrets(keysArray, options);

        this.logger.info(
          `Secrets were unset for '${appName}': ${keysArray.join(', ')}`
        );
      } catch (error) {
        throw new Error(
          `[unset secrets] something broke, check your app secrets\n${error}`
        );
      }
    }
  };
  /**
   * Get the status details of an application
   *
   * @param options - Options for getting app status
   * @returns The app status, or `null` if an app could not be found
   */
  status = async (options?: AppOrConfig): Promise<StatusResponse | null> => {
    try {
      await this.ensureInitialized();

      const status = await this.getAppStatus('nullOnError', options);
      if (status === null) {
        return null;
      }
      return status;
    } catch (error) {
      this.logger.info(`[status] something broke\n${error}`);
      return null;
    }
  };
  /**
   * Get the extended details of an application
   *
   * @param options - Options for getting app details
   * @returns The app details, or `null` if an app could not be found
   */
  statusExtended = async (
    options?: AppOrConfig
  ): Promise<StatusExtendedResponse | null> => {
    try {
      await this.ensureInitialized();
      const status = await this.getAppStatus('nullOnError', options);
      if (status === null) {
        return null;
      }
      const certs = (await this.getAppCerts('nullOnError', options)) || [];
      const secrets = (await this.getAppSecrets('nullOnError', options)) || [];

      return StatusExtendedTransformedResponseSchema.parse({
        ...status,
        domains: certs.map(({ hostname }) => ({ hostname })),
        secrets: secrets.map(({ name }) => ({ name }))
      });
    } catch (error) {
      this.logger.info(`[status extended] something broke\n${error}`);
      return null;
    }
  };

  //
  // Private methods
  //

  /**
   * @private
   * A name will be generated when not provided.
   * @returns The name of the created application
   * @throws An error if the application cannot be created
   */
  private async createApp(
    options?: CreateAppOptions
  ): Promise<CreateAppResponse> {
    const args = ['apps', 'create'];

    args.push(options?.app || '--generate-name');
    args.push('--org', options?.org || this._config.org || 'personal');
    args.push('--json');

    return AppsCreateTransformedResponseSchema.parseAsync(
      await this.execFly(args)
    );
  }

  /**
   * @private
   * @returns The name of the deployed application
   * @throws An error if the deployment fails
   */
  private async deployApp(options?: DeployAppOptions): Promise<string> {
    let appName = '';
    let appSecrets: Array<ListSecretForAppResponse> = [];

    // For deployment to work there must be an app involved,
    // but the app name doesn't have to be in sync with the config file.
    // The `options` concept is by design targeting a single app,
    // except for deployment where the app name can be any value.

    let lookupApp = options?.app || this.instanceApp;
    const lookupConfig = options?.config || this.instanceConfig;

    if (!lookupConfig) {
      throw new Error(
        'Fly config file must be provided to options or class instance, unable to deploy'
      );
    }

    // Lookup the required app config file
    const appConfig = await this.showConfig('nullOnError', {
      config: lookupConfig,
      local: true
    });
    if (!appConfig) {
      throw new Error(
        `Fly config file '${lookupConfig}' does not exist, unable to deploy`
      );
    }

    // Use provided app name or fall back to the app name from the config file
    if (!lookupApp) {
      lookupApp = appConfig.app;
    }

    // Lookup an existing app by name
    if (lookupApp) {
      const status = await this.getAppStatus('nullOnError', {
        app: lookupApp
      });
      if (status) {
        this.logger.info(
          `Found existing application '${lookupApp}' as target for deployment`
        );
        appName = status.name;
      } else {
        this.logger.info(
          `Application '${lookupApp}' not found, try to create a new one with this name`
        );
      }
    }

    // At this point we assume a deployment will be made,
    // otherwise fly will tell us what went wrong
    if (!appName) {
      this.logger.info('Creating a new application...');
      const { name } = await this.createApp({
        app: lookupApp,
        org: options?.org
      });
      appName = name;
      this.logger.info(`Application '${appName}' was created`);
    } else {
      // Not expected to throw since the app exists
      appSecrets = await this.getAppSecrets('throwOnError', { app: appName });
      this.logger.info(`Updating existing application '${appName}'`);
    }

    // Apply secrets to app before deployment. Only set new secrets that don't exist.
    if (options?.secrets) {
      const existingSecrets = new Set(appSecrets.map(({ name }) => name));
      const newSecrets: Record<string, string> = {};

      for (const [key, value] of Object.entries(options.secrets)) {
        if (!existingSecrets.has(key)) {
          newSecrets[key] = value;
        } else {
          this.logger.info(
            `Secret '${key}' already exists for '${appName}', skipping`
          );
        }
      }

      const keys = Object.keys(newSecrets);
      if (keys.length > 0) {
        this.logger.info(`Adding secrets to '${appName}': ${keys.join(', ')}`);
        await this.setAppSecrets(newSecrets, {
          app: appName,
          stage: true
        });
      }
    }

    // Always use provided app name if it exists
    if (options?.app && options.app !== appName) {
      this.logger.info(
        `Using provided app name '${options.app}' instead of '${appName}'`
      );
      appName = options.app;
    }

    // Deploy command
    const args = ['deploy', '--app', appName, '--config', lookupConfig];

    if (options?.region) {
      args.push('--region', options.region);
    }
    if (options?.environment) {
      args.push('--env', `DEPLOY_ENV=${options.environment}`);
    }
    args.push('--yes');

    this.logger.info(`Deploying '${appName}'...`);

    await this.execFly(args);

    return NameSchema.parse(appName);
  }

  /**
   * @private
   * @throws An error if the app cannot be destroyed
   */
  private async destroyApp(app: string, force = false): Promise<void> {
    const args = ['apps', 'destroy', app, '--yes'];

    if (force) args.push('--force');

    await this.execFly(args);
  }

  /**
   * @private
   * @returns The name of the application
   * @throws An error if the secrets cannot be set
   */
  private async setAppSecrets(
    secrets: Record<string, string>,
    options?: SetAppSecretsOptions
  ): Promise<string> {
    const status = await this.getAppStatus('throwOnError', options);

    const args = ['secrets', 'set'];

    args.push(...this.getAppOrConfigArgs(options));
    if (options?.stage) {
      args.push('--stage');
    }
    for (const [key, value] of Object.entries(secrets)) {
      args.push(`${key}=${value.replace(/\\/g, '\\\\').replace(/ /g, '\\ ')}`);
    }

    await this.execFly(args);

    return NameSchema.parse(status.name);
  }

  /**
   * @private
   * @returns The name of the application
   * @throws An error if the secrets cannot be unset
   */
  private async unsetAppSecrets(
    keys: Array<string>,
    options?: UnsetAppSecretsOptions
  ): Promise<string> {
    const status = await this.getAppStatus('throwOnError', options);

    const args = ['secrets', 'unset'];

    args.push(...this.getAppOrConfigArgs(options));
    if (options?.stage) {
      args.push('--stage');
    }
    args.push(...keys);

    await this.execFly(args);

    return NameSchema.parse(status.name);
  }

  /**
   * @private
   * @returns The name of the application
   * @throws An error if the domain cannot be added
   */
  private async addAppCertificate(
    hostname: string,
    options?: AppOrConfig
  ): Promise<string> {
    const status = await this.getAppStatus('throwOnError', options);

    const args = ['certs', 'add', hostname];

    args.push(...this.getAppOrConfigArgs(options));
    // TODO: Analyze output and create a schema for validation
    args.push('--json');

    await this.execFly(args);

    return NameSchema.parse(status.name);
  }

  /**
   * @private
   * @returns The name of the application
   * @throws An error if the domain cannot be removed
   */
  private async removeAppCertificate(
    hostname: string,
    options?: AppOrConfig
  ): Promise<string> {
    const status = await this.getAppStatus('throwOnError', options);

    const args = ['certs', 'remove', hostname];

    args.push(...this.getAppOrConfigArgs(options));
    args.push('--yes');

    await this.execFly(args);

    return NameSchema.parse(status.name);
  }

  /**
   * @private
   * @returns A list of all applications or `null` if listing applications fails and `nullOnError` is used
   * @throws An error if listing applications fails and `throwOnError` is used
   */
  private async getAllApps(
    onError: 'throwOnError'
  ): Promise<Array<ListAppResponse>>;
  private async getAllApps(
    onError: 'nullOnError'
  ): Promise<Array<ListAppResponse> | null>;
  private async getAllApps(
    onError: 'throwOnError' | 'nullOnError'
  ): Promise<Array<ListAppResponse> | null> {
    const args = ['apps', 'list', '--json'];

    try {
      return AppsListTransformedResponseSchema.parseAsync(
        await this.execFly(args)
      );
    } catch (error) {
      if (onError === 'throwOnError') {
        throw error;
      }
      return null;
    }
  }

  /**
   * @private
   * @returns All certificates for all apps or `null` if the certificates cannot be retrieved and `nullOnError` is used
   * @throws An error if the certificates cannot be retrieved
   */
  private async getAllCerts(
    onError: 'throwOnError'
  ): Promise<Array<ListCertForAllResponse>>;
  private async getAllCerts(
    onError: 'nullOnError'
  ): Promise<Array<ListCertForAllResponse> | null>;
  private async getAllCerts(
    onError: 'throwOnError' | 'nullOnError'
  ): Promise<Array<ListCertForAllResponse> | null> {
    try {
      const certs: Array<ListCertForAllResponse> = [];

      // Merge the certs for all apps
      const apps = await this.getAllApps('throwOnError');

      for (const app of apps) {
        const appCerts = await this.getAppCerts('throwOnError', {
          app: app.name
        });
        certs.push(...appCerts.map((cert) => ({ ...cert, app: app.name })));
      }

      return CertsListWithAppTransformedResponseSchema.parse(certs);
    } catch (error) {
      if (onError === 'throwOnError') {
        throw error;
      }
      return null;
    }
  }

  /**
   * @private
   * @returns All secrets for all apps or `null` if the secrets cannot be retrieved and `nullOnError` is used
   * @throws An error if the secrets cannot be retrieved
   */
  private async getAllSecrets(
    onError: 'throwOnError'
  ): Promise<Array<ListSecretForAllResponse>>;
  private async getAllSecrets(
    onError: 'nullOnError'
  ): Promise<Array<ListSecretForAllResponse> | null>;
  private async getAllSecrets(
    onError: 'throwOnError' | 'nullOnError'
  ): Promise<Array<ListSecretForAllResponse> | null> {
    try {
      const secrets: Array<ListSecretForAllResponse> = [];

      // Merge the secrets for all apps
      const apps = await this.getAllApps('throwOnError');

      for (const app of apps) {
        const appSecrets = await this.getAppSecrets('throwOnError', {
          app: app.name
        });
        secrets.push(
          ...appSecrets.map((secret) => ({ ...secret, app: app.name }))
        );
      }

      return SecretsListWithAppTransformedResponseSchema.parse(secrets);
    } catch (error) {
      if (onError === 'throwOnError') {
        throw error;
      }
      return null;
    }
  }

  /**
   * @private
   * @returns The app status or `null` if the app cannot be found and `nullOnError` is used
   * @throws An error if the app cannot be found and `throwOnError` is used
   */
  private async getAppStatus(
    onError: 'throwOnError',
    options?: AppOrConfig
  ): Promise<StatusResponse>;
  private async getAppStatus(
    onError: 'nullOnError',
    options?: AppOrConfig
  ): Promise<StatusResponse | null>;
  private async getAppStatus(
    onError: 'throwOnError' | 'nullOnError',
    options?: AppOrConfig
  ): Promise<StatusResponse | null> {
    const args = ['status'];

    args.push(...this.getAppOrConfigArgs(options));
    args.push('--json');

    let response: StatusResponse | null = null;
    try {
      response = await this.execFly<StatusResponse>(args);
      return StatusTransformedResponseSchema.parse(response);
    } catch (error) {
      if (onError === 'throwOnError') {
        throw error;
      }
      if (error instanceof ZodError) {
        this.logger.info(`Failed to parse response:
${error.message}`);
        this.logger.info(`Raw response:
${JSON.stringify(response, null, 2)}`);
      }
      return null;
    }
  }

  /**
   * @private
   * @returns The certificates for an app or `null` if the certificates cannot be retrieved and `nullOnError` is used
   * @throws An error if the certificates cannot be retrieved and `throwOnError` is used
   */
  private async getAppCerts(
    onError: 'throwOnError',
    options?: AppOrConfig
  ): Promise<Array<ListCertForAppResponse>>;
  private async getAppCerts(
    onError: 'nullOnError',
    options?: AppOrConfig
  ): Promise<Array<ListCertForAppResponse> | null>;
  private async getAppCerts(
    onError: 'throwOnError' | 'nullOnError',
    options?: AppOrConfig
  ): Promise<Array<ListCertForAppResponse> | null> {
    const args = ['certs', 'list'];

    args.push(...this.getAppOrConfigArgs(options));
    args.push('--json');

    try {
      return CertsListTransformedResponseSchema.parseAsync(
        await this.execFly(args)
      );
    } catch (error) {
      if (onError === 'throwOnError') {
        throw error;
      }
      return null;
    }
  }

  /**
   * @private
   * @returns The secrets for an app or `null` if the secrets cannot be retrieved and `nullOnError` is used
   * @throws An error if the secrets cannot be retrieved and `throwOnError` is used
   */
  private async getAppSecrets(
    onError: 'throwOnError',
    options?: AppOrConfig
  ): Promise<Array<ListSecretForAppResponse>>;
  private async getAppSecrets(
    onError: 'nullOnError',
    options?: AppOrConfig
  ): Promise<Array<ListSecretForAppResponse> | null>;
  private async getAppSecrets(
    onError: 'throwOnError' | 'nullOnError',
    options?: AppOrConfig
  ): Promise<Array<ListSecretForAppResponse> | null> {
    const args = ['secrets', 'list'];

    args.push(...this.getAppOrConfigArgs(options));
    args.push('--json');

    try {
      return SecretsListTransformedResponseSchema.parseAsync(
        await this.execFly(args)
      );
    } catch (error) {
      if (onError === 'throwOnError') {
        throw error;
      }
      return null;
    }
  }

  /**
   * @private
   * @returns The config or `null` if the config cannot be retrieved and `nullOnError` is used
   * @throws An error if the config cannot be retrieved and `throwOnError` is used
   */
  private async showConfig(
    onError: 'throwOnError',
    options?: ShowConfigOptions
  ): Promise<ShowConfigResponse>;
  private async showConfig(
    onError: 'nullOnError',
    options?: ShowConfigOptions
  ): Promise<ShowConfigResponse | null>;
  private async showConfig(
    onError: 'throwOnError' | 'nullOnError',
    options?: ShowConfigOptions
  ): Promise<ShowConfigResponse | null> {
    const normalized = this.normalizeOptions(options);
    const config = normalized.config || this.instanceConfig;

    // Check if the config file exists when a path is provided
    if (config && !existsSync(join(cwd(), config))) {
      throw new Error(`Config file '${config}' does not exist`);
    }

    // Get the config
    const args = ['config', 'show'];

    args.push(...this.getAppOrConfigArgs(options));
    if (options && 'local' in options && options.local) {
      args.push('--local');
    }

    try {
      return ConfigShowResponseSchema.parse(await this.execFly(args));
    } catch (error) {
      if (onError === 'throwOnError') {
        throw error;
      }
      return null;
    }
  }

  /**
   * @private
   * Ensure Fly CLI is installed and authenticated
   *
   * @throws An error if Fly CLI is not installed or authentication fails
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    try {
      if (!(await this.isInstalled())) {
        throw new Error('Fly CLI must be installed to use this library');
      }

      this.logger.info('Authenticating with Fly.io...');

      // First check if a user is logged in locally
      let user = await this.execFly<string>(
        ['auth', 'whoami'],
        'nullOnError',
        true // won't use token
      );

      if (user) {
        this.logger.info(`Detected logged in user '${user}'`);
        this.authByLogin = true;
      } else {
        // Fall back to token authentication
        user = await this.execFly<string>(['auth', 'whoami']);
        this.logger.info(`Authenticated by token as '${user}'`);
      }

      this.initialized = true;
    } catch (error) {
      this.logger.error('Failed to initialize Fly');
      throw error;
    }
  }

  /**
   * @private
   * Execute a fly command and optionally return the output as JSON
   *
   * @param command - The fly command to execute (empty array items are ignored)
   * @returns The JSON output of the command, or the raw output if not JSON
   * @throws An error if the command fails
   */
  private async execFly<T = void>(command: string | Array<string>): Promise<T>;
  /**
   * @private
   * Execute a fly command and optionally return the output as JSON
   *
   * Tip! Set `skipToken` to `true` when you only want to authenticate via logged in user
   *
   * @param command - The fly command to execute (empty array items are ignored)
   * @param onError - What to do if the command fails, throw or return `null` (defaults to `throwOnError`)
   * @param skipToken - Skip authentication via token when provided
   * @returns The JSON output of the command, or the raw output if not JSON
   * @throws An error if the command fails and `onError` is `throwOnError`
   */
  private async execFly<T = null>(
    command: string | Array<string>,
    onError: 'nullOnError',
    skipToken?: boolean
  ): Promise<T>;
  private async execFly<T>(
    command: string | Array<string>,
    onError: 'nullOnError' | 'throwOnError' = 'throwOnError',
    skipToken?: boolean
  ): Promise<T> {
    const cmdArr = Array.isArray(command) ? command : [command];

    // Authenticate via token when
    // - not skipping token authentication
    // - not authenticated by a logged in user
    // - a token is provided
    if (!skipToken && !this.authByLogin && this._config.token) {
      cmdArr.push('--access-token', this._config.token);
    }

    const flyCmd = `flyctl ${cmdArr.filter(Boolean).join(' ')}`;

    let stdout = '';

    try {
      this.traceCLI('CALL', flyCmd);
      const result = await exec(flyCmd);
      stdout = result.stdout.trim();
      this.traceCLI('RESULT', stdout);
    } catch (error) {
      this.traceCLI('RESULT', error as string);
      if (onError === 'throwOnError') {
        throw new Error(`Command failed: ${flyCmd}
${error}`);
      }
      return null as T;
    }

    try {
      return JSON.parse(stdout) as T;
    } catch {
      if (stdout) {
        if (this.logger.traceCLI) {
          this.logger.info(`Failed to parse as JSON, returning raw output`);
        }
        return stdout as T;
      }
    }
    return undefined as T;
  }

  /**
   * @private
   * Get the arguments for `AppOrConfig` options
   * where either the application or configuration can be provided
   * but not both.
   *
   * First check `options` and then the class configuration.
   *
   * Should be used in Fly commands with optional flags
   * - `--app`
   * - `--config`
   *
   * @param options - Options to get the arguments for
   * @returns The arguments to use in a fly command
   */
  private getAppOrConfigArgs(options?: AppOrConfig): Array<string> {
    const normalized = this.normalizeOptions(options);

    const app = normalized.app || this.instanceApp;
    const config = normalized.config || this.instanceConfig;

    const args: Array<string> = [];

    if (app) {
      args.push('--app', app);
    }
    if (config) {
      args.push('--config', config);
    }

    if (app && config) {
      this.logger.info(
        `Both app '${app}' and config '${config}' were provided, check your implementation!`
      );
    }

    return args;
  }

  /**
   * @private
   * Check if the Fly CLI is installed
   *
   * @returns `true` if the Fly CLI is installed, `false` otherwise
   */
  private async isInstalled(): Promise<boolean> {
    return (await this.execFly('version', 'nullOnError')) !== null;
  }

  /**
   * @private
   * Normalize the options matching `AppOrConfig` type.
   *
   * A missing value gets an empty string.
   *
   * @param options - The options to normalize
   * @returns The normalized options
   */
  private normalizeOptions<T extends AppOrConfig>(
    options?: T
  ): { app: string; config: string } {
    if (!options) {
      return { app: '', config: '' };
    }

    const app = 'app' in options && options.app ? options.app : '';
    const config = 'config' in options && options.config ? options.config : '';

    return { app, config };
  }

  /**
   * @private
   * Trace the CLI calls, mocks and results
   *
   * @param type - The type of trace
   * @param msg - The message to trace
   */
  private traceCLI(type: 'CALL' | 'MOCK' | 'RESULT', msg: string): void {
    if (this.logger.traceCLI) {
      const typeLabel =
        type === 'CALL' ? ' CALL ' : type === 'MOCK' ? ' MOCK ' : 'RESULT';
      this.logger.info(`[${typeLabel}] ${msg}`);
    }
  }
}
