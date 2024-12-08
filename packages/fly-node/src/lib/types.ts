import { z } from 'zod';

import { AppsCreateTransformedResponseSchema } from './schemas/apps-create.schema';
import { AppsListTransformedResponseSchema } from './schemas/apps-list.schema';
import { CertsListWithAppTransformedResponseSchema } from './schemas/certs-list-with-app.schema';
import { CertsListTransformedResponseSchema } from './schemas/certs-list.schema';
import { ConfigShowResponseSchema } from './schemas/config-show.schema';
import { DeployResponseSchema } from './schemas/deploy.schema';
import { SecretsListWithAppTransformedResponseSchema } from './schemas/secrets-list-with-app.schema';
import { SecretsListTransformedResponseSchema } from './schemas/secrets-list.schema';
import { StatusTransformedResponseSchema } from './schemas/status.schema';

/** List applications */
export type ListAppResponse = z.infer<
  typeof AppsListTransformedResponseSchema.element
>;

/** Create an application */
export type CreateAppResponse = z.infer<
  typeof AppsCreateTransformedResponseSchema
>;

/** Deploy application response */
export type DeployResponse = z.infer<typeof DeployResponseSchema>;

/** List certificates for an application */
export type ListCertForAppResponse = z.infer<
  typeof CertsListTransformedResponseSchema.element
>;

/** List certificates for all applications */
export type ListCertForAllResponse = z.infer<
  typeof CertsListWithAppTransformedResponseSchema.element
>;

/** List secrets for an application */
export type ListSecretForAppResponse = z.infer<
  typeof SecretsListTransformedResponseSchema.element
>;

/** List secrets for all applications */
export type ListSecretForAllResponse = z.infer<
  typeof SecretsListWithAppTransformedResponseSchema.element
>;

/** Show application configuration */
export type ShowConfigResponse = z.infer<typeof ConfigShowResponseSchema>;

/** Get the status of an application */
export type StatusResponse = z.infer<typeof StatusTransformedResponseSchema>;

/**
 * Configuration options for the Fly class.
 */
export type Config = {
  /**
   * Authenticate using a Fly API access token.
   *
   * This token is used unless a currently logged in user is detected.
   *
   * As alternative to token, the `FLY_API_TOKEN` environment variable is also supported.
   */
  token?: string;

  /**
   * The target organisation for your apps.
   *
   * Defaults to your personal organisation.
   */
  org?: string;

  /**
   * The target region for your apps.
   *
   * Defaults to auto-detect the fastest location.
   */
  region?: string;

  /**
   * Customize the logging behaviour.
   */
  logger?: Partial<Logger>;
} & (
  | {
      /**
       * Name of the application to initiate commands on.
       *
       * Use it when your current workspace doesn't have a fly configuration file
       * or you want to target a different application.
       *
       * Defaults to the application defined in `fly.toml` in the current workspace.
       */
      app?: string;
    }
  | {
      /**
       * Path to the fly configuration file to initiate commands on.
       *
       * Use it when your current workspace doesn't have a fly configuration file.
       */
      config?: string;
    }
);

/**
 * Options for initiating commands
 * where the application or configuration is optional
 */
export type AppOrConfig =
  | {
      /**
       * Name of the application.
       *
       * Defaults to the application in the class configuration.
       */
      app?: string;
    }
  | {
      /**
       * Path to the fly configuration file.
       *
       * Defaults to the file in the class configuration.
       */
      config?: string;
    };

/**
 * Options for creating an application
 */
export type CreateAppOptions = {
  /**
   * Name of the application to create.
   *
   * Defaults to a generated name.
   */
  app?: string;

  /**
   * Target organisation for your app.
   *
   * Defaults to the organisation in the class configuration.
   */
  org?: string;
};

/**
 * Options for deploying an application
 */
export type DeployAppOptions = {
  /**
   * Name of the application to deploy.
   *
   * This name can be different from what's defined in the `fly.toml` file.
   * You can for example deploy to a new application but reuse a blueprint.
   *
   * Defaults to the class configuration app or config app, or the app defined in `fly.toml` in the current workspace.
   */
  app?: string;

  /**
   * Path to the `fly.toml` file to deploy.
   *
   * Defaults to the class configuration or the `fly.toml` in the working directory.
   */
  config?: string;

  /**
   * Target environment for the application.
   *
   * TODO Move the idea of environment to the action
   *
   * When value is `'production'` the options `app` and `config` will decide how the application is deployed.
   * This is the normal deployment flow.
   *
   * But when value is something else the application will be deployed to a **preview** environment,
   * with a name according to the provided value.
   *
   * There is only **one** opinionated difference between the two deployment flows:
   * - When deploying to a **preview** environment, a new name will be generated
   * unless a unique `app` name is provided
   *
   * Environment variable `DEPLOY_ENV` will be set to the provided value.
   *
   * _Typical values for a preview environment can be `'staging'`, `'testing'`, `'development'`, `'preview'`, `'review'`, etc.
   * This is up to the developer to choose._
   */
  environment?: string;

  /**
   * Target organisation for the application.
   *
   * Only used when a new application must be created.
   * Defaults to the organisation in the class configuration.
   */
  org?: string;

  /**
   * Target region for the application.
   *
   * Defaults to the region in the class configuration.
   */
  region?: string;

  /**
   * Secrets to set for the application.
   *
   * Spaces are supported in values.
   */
  secrets?: Record<string, string>;
};

/**
 * Options for showing an application's configuration
 */
export type ShowConfigOptions =
  | {
      /**
       * Name of the application to show the remote configuration for.
       */
      app?: string;
    }
  | {
      /**
       * Path to a `fly.toml` file to extract the application name from.
       *
       * The configuration will be fetched from the application on remote.
       */
      config?: string;

      /**
       * Whether to show the local `fly.toml` file instead of the remote configuration.
       *
       * Use this option when the application is not deployed yet.
       *
       * Defaults to `false`.
       */
      local?: boolean;
    };

/**
 * Options for setting application secrets
 */
export type SetAppSecretsOptions = AppOrConfig & {
  /**
   * Whether to only stage the secrets and skip the deployment.
   */
  stage?: boolean;
};

/**
 * Options for unsetting application secrets
 */
export type UnsetAppSecretsOptions = SetAppSecretsOptions;

/**
 * Extended application status
 */
export type StatusExtendedResponse = StatusResponse & {
  domains: Array<Pick<ListCertForAppResponse, 'hostname'>>;
  secrets: Array<Pick<ListSecretForAppResponse, 'name'>>;
};

/**
 * Logger interface using the `console` signature
 */
export type Logger = {
  /**
   * Log informational messages function.
   *
   * Defaults to `console.log`.
   */
  info: typeof console.log;

  /**
   * Log error messages function.
   *
   * Defaults to `console.error`.
   */
  error: typeof console.error;

  /**
   * Whether to trace the `flyctl` CLI commands.
   *
   * Logs the Fly CLI commands being called and the returned results
   * with special formatting for better readability.
   *
   * It's useful for debugging the CLI commands or just to see what's happening under the hood.
   *
   * Errors are most likely to be unknown application names or missing configuration files
   * that are hidden from the user by the library.
   *
   * Defaults to `false`.
   *
   * @example
   *
   * ```sh
   * # success
   * [ CALL ] flyctl auth whoami
   * [RESULT] auth@user.io
   * [ CALL ] flyctl certs list --app demo-app --json
   * [RESULT] [
   *   {
   *     "CreatedAt": "2022-11-20T22:36:46Z",
   *     "Hostname": "*.demo-app.io",
   *     "ClientStatus": "Ready"
   *   },
   * ]
   *
   * # error
   * [ CALL ] flyctl status --config apps/demo-app/fly.toml --json
   * [RESULT] Error: Command failed: flyctl status --config apps/demo-app/fly.toml --json
   * Error: the config for your app is missing an app name, add an app field to the fly.toml file or specify with the -a flag
   * ```
   */
  traceCLI: boolean;
};
