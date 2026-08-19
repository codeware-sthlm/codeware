/**
 * How the platform's integrations resolved at boot.
 *
 * Facts only — the judgement lives in {@link summarizeIntegrations}, so the
 * server can hand over what it read without deciding what it means, and the
 * rules stay testable without an env.
 *
 * Deliberately carries no credential. `emailHost` is the furthest this goes,
 * because a host is what tells a catcher apart from a real relay.
 */
export type IntegrationFacts = {
  deployEnv: string;
  /** Which transport `env.EMAIL` resolved to, or null when none did */
  email: 'sendgrid' | 'smtp' | 'ethereal' | null;
  /** Host for the `smtp` transport, which is how a local catcher shows up */
  emailHost?: string | null;
  /**
   * The Sentry org errors are reported to, or null when Sentry is off.
   *
   * The org slug rather than a boolean: "error tracking: sentry" restates the
   * label, while the org answers the question someone opens the sheet with —
   * *which* project is receiving them. Never the DSN.
   */
  sentryOrg: string | null;
  /** The bucket uploads land in, or null when storage is not configured */
  storageBucket: string | null;
  /** Endpoint host for the bucket, which names a non-AWS provider */
  storageEndpoint?: string | null;
  /**
   * How the platform authenticates to Infisical, or null when it cannot.
   *
   * Worth its own row rather than folding into the others: Infisical is the
   * gateway the rest reach through — the Fly token that issues certificates
   * lives inside it — so "not set up" here explains failures that look like
   * they belong to a different integration entirely.
   */
  infisicalAuth: 'universal-auth' | 'service-token' | null;
  /** Which Infisical region, `eu` or `us` */
  infisicalSite?: string | null;
};

export type IntegrationsVerdict =
  | { tone: 'error'; kind: 'email-missing' }
  | { tone: 'error'; kind: 'email-not-delivered' }
  | { tone: 'warning'; kind: 'incomplete'; count: number }
  | { tone: 'ok'; kind: 'all-configured' }
  | { tone: 'neutral'; kind: 'not-production' };

/** Hosts that mean "a developer's mail catcher", not a relay to the internet */
const CATCHER_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'mailpit']);

const isCatcher = (host: string | null | undefined) =>
  Boolean(host && CATCHER_HOSTS.has(host.toLowerCase()));

/**
 * What the integrations widget says, before it is put into words.
 *
 * Only production is judged strictly. A preview app posting into a throwaway
 * inbox is the arrangement working as intended, and flagging it would put a
 * permanent amber on every pull request until the colour stopped meaning
 * anything.
 */
export const summarizeIntegrations = (
  facts: IntegrationFacts
): IntegrationsVerdict => {
  if (facts.deployEnv !== 'production') {
    return { tone: 'neutral', kind: 'not-production' };
  }

  if (!facts.email) {
    return { tone: 'error', kind: 'email-missing' };
  }

  // Mail that resolves somewhere nobody reads is worse than mail that fails:
  // a send that "succeeds" into Ethereal looks healthy from every angle
  if (facts.email === 'ethereal' || isCatcher(facts.emailHost)) {
    return { tone: 'error', kind: 'email-not-delivered' };
  }

  const missing = [
    facts.sentryOrg,
    facts.storageBucket,
    facts.infisicalAuth
  ].filter((value) => !value).length;
  if (missing) {
    return { tone: 'warning', kind: 'incomplete', count: missing };
  }

  return { tone: 'ok', kind: 'all-configured' };
};

/** What the running build is, as the widget needs it */
export type BuildFacts = {
  version: string;
  /** Short commit sha; empty on a build that was never stamped */
  sha: string;
  /** ISO timestamp the image was built; empty on an unstamped build */
  buildTime: string;
  deployEnv: string;
  appMode: 'host' | 'tenant';
};

export type BuildVerdict =
  | { tone: 'warning'; kind: 'unstamped' }
  | { tone: 'neutral'; kind: 'informational' };

/**
 * Mostly an informational widget, with one real finding.
 *
 * A production build with no sha or build time cannot be traced back to a
 * commit, which is only ever discovered at the moment that tracing matters.
 */
export const summarizeBuild = (facts: BuildFacts): BuildVerdict =>
  facts.deployEnv === 'production' && (!facts.sha || !facts.buildTime)
    ? { tone: 'warning', kind: 'unstamped' }
    : { tone: 'neutral', kind: 'informational' };
