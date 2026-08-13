import { FlyApi } from '@cdwr/fly-node/api';
import { getIntegrationCredentials } from '@codeware/shared/feature/infisical';

/** Infisical folder holding the Fly credentials */
const PROVIDER = 'fly';

/** Secret that authenticates every Fly api call */
const TOKEN_KEY = 'API_TOKEN';

/**
 * A Fly client for managing tenant certificates, or `null` when the platform
 * has no Fly credentials.
 *
 * Custom domains are optional infrastructure: a workspace running without the
 * integration configured should still boot, still serve, and still show its
 * domains panel - explaining that the platform cannot reach Fly yet rather than
 * failing to render. Returning `null` makes callers say what to do about it,
 * which a thrown error at import time could not.
 *
 * The token is org-scoped, so one client covers every tenant's app. It is read
 * from Infisical on demand rather than injected into the environment at boot,
 * which is why this is async - see `getIntegrationCredentials`.
 *
 * @throws An error if Infisical itself is unreachable or misconfigured. A
 * missing integration is not an error; a broken secret store is.
 */
export const getFlyApi = async (): Promise<FlyApi | null> => {
  const credentials = await getIntegrationCredentials(PROVIDER, {
    environment: process.env['DEPLOY_ENV']
  });

  const token = credentials[TOKEN_KEY];

  if (!token) {
    return null;
  }

  return new FlyApi({ token });
};
