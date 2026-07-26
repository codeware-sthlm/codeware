import type { Environment } from '@codeware/shared/feature/infisical';

/** Infisical region the tenancy config connects to */
export type InfisicalSite = 'eu' | 'us';

/** Config for connecting to Infisical to resolve deploy tenancy (via `withInfisical`) */
export type InfisicalConfig = {
  environment: Environment;
  clientId: string;
  clientSecret: string;
  projectId: string;
  site: InfisicalSite;
};
