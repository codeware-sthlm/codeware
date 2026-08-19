import type { PlatformData } from '@codeware/app-cms/ui/dashboard';
import type { DomainStatusItem } from '@codeware/app-cms/ui/domains';
import type { Env } from '@codeware/app-cms/util/env-schema';
import type { BasePayload, TypedUser } from 'payload';

import { getAppInfo } from '../../../app-info';

/** A stored certificate, as it reads back out of the database */
type StoredCertificate = {
  isConfigured?: boolean | null;
  status?: string | null;
  checkedAt?: string | null;
  rateLimitedUntil?: string | null;
  dnsValidationHostname?: string | null;
  validationErrors?: Array<string> | null;
};

type StoredDomain = {
  hostname?: string | null;
  app?: string | null;
  certificate?: StoredCertificate | null;
};

/**
 * Mirrors `DomainsPanel`'s own reading of a stored certificate.
 *
 * Checked against several fields rather than `status` alone: a single field
 * coming back empty would misclassify a real certificate as never requested,
 * which on the overview would read as a domain with no tls at all.
 */
const wasRequested = (certificate: StoredCertificate | null) =>
  Boolean(
    certificate?.status ||
    certificate?.isConfigured ||
    certificate?.rateLimitedUntil ||
    certificate?.dnsValidationHostname
  );

const isRateLimited = (until: string | null | undefined) =>
  Boolean(until && new Date(until).getTime() > Date.now());

const certificateStatus = (
  certificate: StoredCertificate | null
): DomainStatusItem['status'] => {
  if (!wasRequested(certificate)) {
    return 'not-requested';
  }
  if (certificate?.isConfigured) {
    return 'active';
  }
  return isRateLimited(certificate?.rateLimitedUntil) ? 'paused' : 'pending';
};

const toItems = (
  domains: Array<StoredDomain> | null | undefined,
  owner: string,
  href: string,
  formatChecked: (checkedAt: string) => string
): Array<DomainStatusItem> =>
  (domains ?? [])
    .filter((domain): domain is StoredDomain & { hostname: string } =>
      Boolean(domain.hostname)
    )
    .map((domain) => {
      const certificate = domain.certificate ?? null;
      return {
        hostname: domain.hostname,
        app: domain.app ?? '',
        status: certificateStatus(certificate),
        statusDetail: certificate?.status ?? null,
        // Fly's log of failed issuance attempts. Only meaningful while the
        // certificate is not yet configured — on an issued one it is history,
        // and COD-438 established that stale prose must not be trusted there.
        hasIssues: Boolean(
          !certificate?.isConfigured && certificate?.validationErrors?.length
        ),
        checkedLabel: certificate?.checkedAt
          ? formatChecked(certificate.checkedAt)
          : null,
        href,
        owner
      };
    });

/**
 * Every custom domain on the platform, plus how it is configured to run.
 *
 * Reads only what the last check stored. Nothing here calls Fly: the dashboard
 * is the first page an admin lands on, and making it wait on an external api
 * would trade a page that always loads for a page that is sometimes current.
 * `checkedLabel` is what keeps that honest.
 *
 * `overrideAccess: false` is deliberate even though the caller is already
 * known to be a system user — the query should be answerable by exactly what
 * that user may read, not by what this function happens to know.
 */
export const getPlatformData = async (
  payload: BasePayload,
  user: TypedUser | null | undefined,
  env: Env,
  formatChecked: (checkedAt: string) => string
): Promise<PlatformData> => {
  const [tenants, settings] = await Promise.all([
    payload.find({
      collection: 'tenants',
      depth: 0,
      limit: 0,
      overrideAccess: false,
      user,
      sort: 'name'
    }),
    payload.find({
      collection: 'platform-settings',
      depth: 0,
      limit: 1,
      overrideAccess: false,
      user
    })
  ]);

  const platformRow = settings.docs.at(0);

  const domains = [
    ...tenants.docs.flatMap((tenant) =>
      toItems(
        tenant.domains as Array<StoredDomain> | null,
        tenant.name ?? String(tenant.id),
        `/admin/collections/tenants/${tenant.id}`,
        formatChecked
      )
    ),
    ...toItems(
      (platformRow?.domains ?? null) as Array<StoredDomain> | null,
      env.APP_NAME,
      platformRow
        ? `/admin/collections/platform-settings/${platformRow.id}`
        : '/admin/collections/platform-settings',
      formatChecked
    )
  ];

  const appInfo = getAppInfo(env);

  return {
    domains,
    integrations: {
      deployEnv: env.DEPLOY_ENV,
      email: env.EMAIL
        ? 'sendgrid' in env.EMAIL
          ? 'sendgrid'
          : 'smtp' in env.EMAIL
            ? 'smtp'
            : 'ethereal'
        : null,
      emailHost:
        env.EMAIL && 'smtp' in env.EMAIL
          ? (env.EMAIL.smtp?.host ?? null)
          : null,
      sentry: Boolean(env.SENTRY),
      // Mirrors `getS3StoragePlugin`'s own gate, which is the bucket rather
      // than the access key the env transform keys on. Reporting "set up" off
      // a stray access key would put a green tick on storage the plugin has
      // left disabled — the exact false reassurance this widget exists to
      // prevent. The literal 'undefined' guard is not paranoia: the transform
      // builds `bucket` with `String(S3_BUCKET)`, and every S3 var is
      // individually optional with no refinement tying them together.
      storage: Boolean(
        env.S3_STORAGE?.bucket && env.S3_STORAGE.bucket !== 'undefined'
      )
    },
    build: {
      version: appInfo.version,
      sha: appInfo.sha,
      buildTime: appInfo.buildTime,
      deployEnv: appInfo.deployEnv,
      appMode: env.APP_MODE.type
    }
  };
};
