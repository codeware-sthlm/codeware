import type {
  MailDeliveryFailure,
  PlatformData
} from '@codeware/app-cms/ui/dashboard';
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
  issuedCertificates?: Array<{ expiresAt?: string | null } | null> | null;
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

/**
 * The soonest expiry across a domain's issued certificates.
 *
 * Fly issues an RSA and an ECDSA certificate per hostname and renews them
 * together, so these normally agree — taking the earliest means a pair that
 * has drifted apart is judged by whichever half lapses first.
 */
const earliestExpiry = (
  certificate: StoredCertificate | null
): string | null => {
  const dates = (certificate?.issuedCertificates ?? [])
    .map((entry) => entry?.expiresAt)
    .filter((value): value is string => Boolean(value))
    .sort();
  return dates.at(0) ?? null;
};

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
        expiresAt: earliestExpiry(certificate),
        href,
        owner
      };
    });

/**
 * How the platform authenticates to Infisical, read straight from the process
 * environment.
 *
 * Deliberately not from `getEnv()`: the `INFISICAL_*` variables belong to
 * `libs/shared/feature/infisical`, which resolves them itself and is used well
 * outside this app. Mirrors that lib's own `ClientSchema` — a project id, plus
 * either a machine identity or a service token.
 */
const infisicalAuth = (): 'universal-auth' | 'service-token' | null => {
  if (!process.env['INFISICAL_PROJECT_ID']) {
    return null;
  }
  if (process.env['INFISICAL_SERVICE_TOKEN']) {
    return 'service-token';
  }
  return process.env['INFISICAL_CLIENT_ID'] &&
    process.env['INFISICAL_CLIENT_SECRET']
    ? 'universal-auth'
    : null;
};

/**
 * An S3 field that was actually supplied.
 *
 * The env transform stringifies each one unconditionally, so a missing var
 * arrives as the literal `'undefined'` rather than as nothing.
 */
const usableS3Value = (value: string | undefined): string | null =>
  value && value !== 'undefined' ? value : null;

/**
 * How far back the mail delivery widget looks.
 *
 * Long enough that a real, ongoing misconfiguration stays visible for a
 * normal working week; short enough that a single resolved incident ages out
 * on its own instead of colouring the dashboard forever.
 */
const MAIL_DELIVERY_WINDOW_DAYS = 7;

/** Minimal shape read off a `depth: 1` form-submissions query */
type FailedSubmission = {
  id: number;
  form: number | { title?: string | null } | null;
  tenant?: (number | null) | { name?: string | null; id: number };
  createdAt: string;
};

const toMailFailure = (submission: FailedSubmission): MailDeliveryFailure => ({
  id: submission.id,
  formTitle:
    submission.form && typeof submission.form === 'object'
      ? (submission.form.title ?? null)
      : null,
  owner:
    submission.tenant && typeof submission.tenant === 'object'
      ? (submission.tenant.name ?? String(submission.tenant.id))
      : String(submission.tenant ?? ''),
  receivedAt: submission.createdAt,
  href: `/admin/collections/form-submissions/${submission.id}`
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
  const since = new Date(
    Date.now() - MAIL_DELIVERY_WINDOW_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const [tenants, settings, delivered, failed] = await Promise.all([
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
    }),
    payload.count({
      collection: 'form-submissions',
      where: {
        and: [
          { createdAt: { greater_than_equal: since } },
          { notificationStatus: { exists: true } }
        ]
      },
      overrideAccess: false,
      user
    }),
    // Depth 1 populates `form` and `tenant` in one pass — every field
    // `MailFailureRow` needs, so no per-row lookup on top of this query
    payload.find({
      collection: 'form-submissions',
      where: {
        and: [
          { createdAt: { greater_than_equal: since } },
          { notificationStatus: { equals: 'failed' } }
        ]
      },
      depth: 1,
      limit: 50,
      sort: '-createdAt',
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
      // `env.SENTRY` only exists when both DSN and org are set, so the org
      // being present is exactly the configured signal — no separate boolean
      sentryOrg: env.SENTRY?.org ?? null,
      // Keyed on the bucket, mirroring `getS3StoragePlugin`'s own gate rather
      // than the access key the env transform keys on. Reporting "set up" off
      // a stray access key would put a green tick on storage the plugin has
      // left disabled — the exact false reassurance this widget exists to
      // prevent. The literal 'undefined' guard is not paranoia: the transform
      // builds `bucket` with `String(S3_BUCKET)`, and every S3 var is
      // individually optional with no refinement tying them together.
      storageBucket: usableS3Value(env.S3_STORAGE?.bucket),
      storageEndpoint: usableS3Value(env.S3_STORAGE?.endpoint),
      infisicalAuth: infisicalAuth(),
      // Region and auth mode only. The project id is not a credential, but it
      // is an identifier with no diagnostic value here, so it stays out
      infisicalSite: process.env['INFISICAL_SITE'] ?? 'us'
    },
    mailDelivery: {
      total: delivered.totalDocs,
      failed: failed.totalDocs,
      failures: failed.docs.map(toMailFailure)
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
