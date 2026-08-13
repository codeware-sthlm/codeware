import {
  type FolderSecrets,
  withInfisical
} from '@codeware/shared/feature/infisical';

import { matchesDomain } from './match-domain-secret';

/** Where per-tenant deployment configuration lives */
const TENANTS_PATH = '/tenants';

/** Tag the cms reads at boot to build its allowed origins */
const CORS_TAG = 'cors';

/** A secret somewhere in Infisical that points at a domain */
export type DomainSecret = {
  /** Folder it lives in, e.g. `/tenants/moon/apps/web` */
  path: string;
  key: string;
  /** Whether it is tagged `cors`, which is what lets the cms answer that origin */
  isCorsTagged: boolean;
};

export type DomainSecretsReport = {
  /** Every secret found pointing at the hostname */
  secrets: Array<DomainSecret>;
  /** Whether at least one of them is tagged `cors` */
  hasCors: boolean;
  /** Set when Infisical could not be read, so "none found" is not mistaken for "none exists" */
  unavailable: boolean;
};

/**
 * Find where Infisical already mentions a domain.
 *
 * Adding a domain to a workspace and getting a certificate for it is only half
 * the wiring. The app has to be *told* to serve that url, and the cms has to
 * accept it as an origin — both of which live in Infisical and are edited by
 * hand. A domain with a valid certificate and no secret behind it looks
 * finished from here and is broken in the browser.
 *
 * Searched by value rather than by looking under a known path, for two reasons:
 * an Infisical tenant id is not a Payload tenant slug, so there is no reliable
 * mapping to follow; and searching finds the domain configured under the *wrong*
 * tenant folder, which is a mistake worth seeing rather than one worth missing.
 *
 * Read-only on purpose. The panel reports what it finds and leaves the editing
 * where it belongs.
 *
 * @param hostname - Normalized hostname from the domain row
 */
export const findDomainSecrets = async (
  hostname: string
): Promise<DomainSecretsReport> => {
  const environment = process.env['DEPLOY_ENV'];

  // Two reads rather than trusting a `tags` field: the tag filter is the api's
  // own, and is what `load-env` already relies on to build CORS_URLS
  const [all, tagged] = await Promise.all([
    read({ environment }),
    read({ environment, tags: [CORS_TAG] })
  ]);

  if (!all) {
    return { secrets: [], hasCors: false, unavailable: true };
  }

  const corsKeys = new Set(
    (tagged ?? []).flatMap(({ path, secrets }) =>
      secrets
        .filter(({ secretValue }) => matchesDomain(secretValue, hostname))
        .map(({ secretKey }) => `${path}|${secretKey}`)
    )
  );

  const secrets = all.flatMap(({ path, secrets }) =>
    secrets
      .filter(({ secretValue }) => matchesDomain(secretValue, hostname))
      .map(({ secretKey }) => ({
        path,
        key: secretKey,
        isCorsTagged: corsKeys.has(`${path}|${secretKey}`)
      }))
  );

  return {
    secrets,
    hasCors: secrets.some(({ isCorsTagged }) => isCorsTagged),
    // A failed *tag* read alone still leaves the main answer usable
    unavailable: false
  };
};

const read = ({
  environment,
  tags
}: {
  environment?: string;
  tags?: Array<string>;
}): Promise<Array<FolderSecrets> | null> =>
  withInfisical({
    environment,
    // Shallow per folder, but `groupByFolder` still walks every folder under
    // the path — so each secret is seen once, with the folder it lives in
    filter: { path: TENANTS_PATH, recurse: false, tags },
    groupByFolder: true,
    silent: true
  });
