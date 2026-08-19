import { z } from 'zod';

/**
 * A certificate as the Fly GraphQL API returns it.
 *
 * Field names are Fly's own, verbatim — `isConfigured` rather than a friendlier
 * `configured` — so anything read here can be cross-referenced against Fly's
 * schema without a translation step. The CLI schemas in this package normalise
 * CLI output instead; where the two overlap (`hostname`, `clientStatus`,
 * `createdAt`) they agree.
 *
 * Strict about the fields a caller acts on and tolerant about the rest: Fly
 * owns this schema, and a domains screen should not stop rendering because a
 * peripheral field changed shape.
 */
export const CertificateApiResponseSchema = z.object({
  hostname: z.string(),
  /** Issued and serving. This is what decides whether a domain is usable */
  isConfigured: z.boolean(),
  id: z.string().optional(),
  /** The apex or a subdomain — apex domains cannot use a CNAME */
  isApex: z.boolean().optional(),
  isWildcard: z.boolean().optional(),
  /** Which ACME challenge has been satisfied, if any */
  isAcmeDnsConfigured: z.boolean().optional(),
  isAcmeAlpnConfigured: z.boolean().optional(),
  isAcmeHttpConfigured: z.boolean().optional(),
  certificateAuthority: z.string().nullish(),
  certificateRequestedAt: z.string().nullish(),
  createdAt: z.string().nullish(),
  domain: z.string().nullish(),
  dnsProvider: z.string().nullish(),
  /** Hostname the validation record must be created on */
  dnsValidationHostname: z.string().nullish(),
  /** Value that record must contain */
  dnsValidationTarget: z.string().nullish(),
  /** Fly's own prose describing the records to create */
  dnsValidationInstructions: z.string().nullish(),
  /** Fly's summary of where issuance has got to */
  clientStatus: z.string().nullish(),
  /**
   * Set when Let's Encrypt has rate-limited further attempts for this domain.
   *
   * Worth surfacing rather than swallowing: it is the one failure a customer
   * cannot fix by correcting DNS, and retrying only makes it worse.
   */
  rateLimitedUntil: z.string().nullish(),
  source: z.string().nullish(),
  /**
   * Fly's own prose for a failed issuance attempt — what the dashboard shows,
   * unlike `HostnameCheck.errors`, which is SCREAMING_SNAKE_CASE codes
   */
  validationErrors: z
    .array(
      z.object({
        message: z.string(),
        timestamp: z.string()
      })
    )
    .nullish(),
  /**
   * The certificates actually issued for this hostname, once any have been.
   *
   * A connection rather than a list because that is how Fly models it. Two
   * nodes is the normal count — one RSA and one ECDSA — sharing an expiry,
   * which is why a caller usually wants the expiry rather than the rows.
   */
  issued: z
    .object({
      nodes: z
        .array(
          z.object({
            id: z.string().nullish(),
            /** Key type, e.g. `RSA` or `ECDSA` */
            type: z.string().nullish(),
            hostname: z.string().nullish(),
            expiresAt: z.string().nullish()
          })
        )
        .nullish()
    })
    .nullish()
});

export type Certificate = z.infer<typeof CertificateApiResponseSchema>;

/**
 * What Fly sees when it resolves the hostname right now.
 *
 * Returned alongside a newly requested certificate. This is live DNS
 * resolution rather than stored state, which is what makes it the right thing
 * to show someone who has just edited their records and wants to know whether
 * it worked.
 */
export const HostnameCheckApiResponseSchema = z.object({
  aRecords: z.array(z.string()).nullish(),
  aaaaRecords: z.array(z.string()).nullish(),
  cnameRecords: z.array(z.string()).nullish(),
  caaRecords: z.array(z.string()).nullish(),
  soa: z.string().nullish(),
  dnsProvider: z.string().nullish(),
  dnsVerificationRecord: z.string().nullish(),
  dnsConfigured: z.boolean().nullish(),
  acmeDnsConfigured: z.boolean().nullish(),
  resolvedAddresses: z.array(z.string()).nullish(),
  isProxied: z.boolean().nullish(),
  errors: z.array(z.string()).nullish()
});

export type HostnameCheck = z.infer<typeof HostnameCheckApiResponseSchema>;

/**
 * The records a customer has to create, extracted from a certificate.
 *
 * `isApex` matters here: an apex domain cannot be pointed with a CNAME, so the
 * instructions differ, and a UI needs to know which case it is showing.
 */
export const DnsInstructionsSchema = z.object({
  hostname: z.string().nullish(),
  target: z.string().nullish(),
  instructions: z.string().nullish(),
  isApex: z.boolean().optional()
});

export type DnsInstructions = z.infer<typeof DnsInstructionsSchema>;

/** Certificates listed for an app */
export const CertificateListApiResponseSchema = z.array(
  CertificateApiResponseSchema
);
