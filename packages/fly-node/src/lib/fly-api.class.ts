import {
  type Certificate,
  CertificateApiResponseSchema,
  CertificateListApiResponseSchema,
  type DnsInstructions,
  type HostnameCheck,
  HostnameCheckApiResponseSchema
} from './schemas/certificate.schema';

/** Fly's GraphQL endpoint */
const FLY_API_URL = 'https://api.fly.io/graphql';

export type FlyApiConfig = {
  /** Fly API token. An org-scoped token can manage certificates for its apps */
  token: string;
  /** Override the endpoint, for tests or a private Fly instance */
  apiUrl?: string;
  /** Called with a one-line description of every request; defaults to silence */
  log?: (message: string) => void;
};

/** A GraphQL error as Fly returns it — status 200 with an `errors` array */
type GraphQLError = { message: string; extensions?: { code?: string } };

/**
 * Fly over its GraphQL API, with no `flyctl` in sight.
 *
 * The `Fly` class in this package drives the CLI, which is the right tool in
 * CI: it can build and deploy, and a runner has the binary. It cannot run
 * inside an application server — there is no binary in the image, and the
 * interactive paths need a pty.
 *
 * This class exists for the operations an application needs to perform on
 * itself at runtime. It is deliberately a small subset rather than a second
 * implementation of the whole CLI: certificates today, because a custom domain
 * has to be requested, checked and shown to a customer while they wait.
 *
 * Where both can do the same thing the returned shapes agree, so a caller can
 * move between them. Where they differ, the API gives *more*: issuance state
 * and the DNS records to create come back as fields rather than as text a
 * human was meant to read.
 */
export class FlyApi {
  private readonly token: string;
  private readonly apiUrl: string;
  private readonly log: (message: string) => void;

  constructor(config: FlyApiConfig) {
    if (!config.token) {
      throw new Error('[fly-api] A Fly API token is required');
    }

    this.token = config.token;
    this.apiUrl = config.apiUrl ?? FLY_API_URL;
    this.log = config.log ?? (() => undefined);
  }

  /**
   * Manage certificates for an app.
   *
   * Every method takes the app name explicitly: this client is used by a
   * process acting on *other* apps — the cms managing a tenant's web app — so
   * there is no ambient "current app" to default to.
   */
  certs = {
    /**
     * Request a certificate for a hostname.
     *
     * Safe to call when one already exists: Fly returns the existing
     * certificate rather than erroring, which keeps callers idempotent.
     *
     * Requesting before DNS is in place is normal and expected — the
     * certificate stays pending until the records resolve, and the returned
     * validation fields are what you show the customer meanwhile.
     *
     * @param app - Fly app name the domain should serve from
     * @param hostname - Domain without a scheme, e.g. `tours.example.com`
     * @returns The certificate, plus what Fly resolves for that hostname now
     */
    add: async (
      app: string,
      hostname: string
    ): Promise<{ certificate: Certificate; check: HostnameCheck | null }> => {
      const data = await this.request<{
        addCertificate: { certificate: unknown; check: unknown };
      }>(
        `mutation AddCertificate($appId: ID!, $hostname: String!) {
          addCertificate(appId: $appId, hostname: $hostname) {
            certificate { ${CERTIFICATE_FIELDS} }
            check { ${HOSTNAME_CHECK_FIELDS} }
          }
        }`,
        { appId: app, hostname }
      );

      return {
        certificate: CertificateApiResponseSchema.parse(
          data.addCertificate.certificate
        ),
        // Live resolution, and it comes back with the mutation for free — the
        // customer has usually just edited DNS and wants to know if it took
        check: data.addCertificate.check
          ? HostnameCheckApiResponseSchema.parse(data.addCertificate.check)
          : null
      };
    },

    /**
     * Read one certificate, or `null` when the app has none for that hostname.
     *
     * This is the call behind a "check" button: it re-reads issuance state from
     * Fly rather than trusting anything stored locally.
     */
    get: async (app: string, hostname: string): Promise<Certificate | null> => {
      const data = await this.request<{
        app: { certificate: unknown } | null;
      }>(
        `query AppCertificate($appName: String!, $hostname: String!) {
          app(name: $appName) {
            certificate(hostname: $hostname) { ${CERTIFICATE_FIELDS} }
          }
        }`,
        { appName: app, hostname }
      );

      const certificate = data.app?.certificate;

      return certificate
        ? CertificateApiResponseSchema.parse(certificate)
        : null;
    },

    /** Every certificate on an app */
    list: async (app: string): Promise<Array<Certificate>> => {
      const data = await this.request<{
        app: { certificates: { nodes: Array<unknown> } } | null;
      }>(
        `query AppCertificates($appName: String!) {
          app(name: $appName) {
            certificates { nodes { ${CERTIFICATE_FIELDS} } }
          }
        }`,
        { appName: app }
      );

      return CertificateListApiResponseSchema.parse(
        data.app?.certificates?.nodes ?? []
      );
    },

    /**
     * Remove a certificate.
     *
     * The hostname keeps resolving until its DNS is changed — this only stops
     * Fly serving TLS for it.
     */
    remove: async (app: string, hostname: string): Promise<void> => {
      await this.request(
        `mutation DeleteCertificate($appId: ID!, $hostname: String!) {
          deleteCertificate(appId: $appId, hostname: $hostname) {
            certificate { hostname }
          }
        }`,
        { appId: app, hostname }
      );
    }
  };

  /**
   * The DNS records a customer must create for a certificate to validate.
   *
   * Pulled out of the certificate rather than fetched, so a caller that
   * already has one does not pay for a second round trip.
   */
  static dnsInstructions(certificate: Certificate): DnsInstructions {
    return {
      hostname: certificate.dnsValidationHostname,
      target: certificate.dnsValidationTarget,
      instructions: certificate.dnsValidationInstructions,
      isApex: certificate.isApex
    };
  }

  /**
   * @private
   * One GraphQL round trip.
   *
   * Fly answers a failed query with HTTP 200 and an `errors` array, so a
   * response is only successful when both are checked — trusting the status
   * alone would turn "permission denied" into a parse error further down.
   */
  private async request<T>(
    query: string,
    variables: Record<string, unknown>
  ): Promise<T> {
    const operation = /(?:query|mutation)\s+(\w+)/.exec(query)?.[1] ?? 'query';
    this.log(`[fly-api] ${operation} ${JSON.stringify(variables)}`);

    let response: Response;

    try {
      response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query, variables })
      });
    } catch (error) {
      // Network failure: worth separating from a rejection by Fly, because the
      // caller can retry this one
      throw new Error(`[fly-api] ${operation} could not reach Fly: ${error}`);
    }

    if (!response.ok) {
      throw new Error(
        `[fly-api] ${operation} failed: ${response.status} ${response.statusText}`
      );
    }

    const body = (await response.json()) as {
      data?: T;
      errors?: Array<GraphQLError>;
    };

    if (body.errors?.length) {
      throw new Error(
        `[fly-api] ${operation} failed: ${body.errors
          .map((error) => error.message)
          .join('; ')}`
      );
    }

    if (!body.data) {
      throw new Error(`[fly-api] ${operation} returned no data`);
    }

    return body.data;
  }
}

/**
 * Field selection shared by every certificate query.
 *
 * Kept in one place so the schema and the selection cannot drift apart.
 */
const CERTIFICATE_FIELDS = `
  id
  hostname
  isConfigured
  isApex
  isWildcard
  isAcmeDnsConfigured
  isAcmeAlpnConfigured
  isAcmeHttpConfigured
  certificateAuthority
  certificateRequestedAt
  createdAt
  domain
  dnsProvider
  dnsValidationHostname
  dnsValidationTarget
  dnsValidationInstructions
  clientStatus
  rateLimitedUntil
  source
`;

/**
 * Live DNS resolution for a hostname.
 *
 * Deliberately absent from `list`: `AppCertificate.check` resolves DNS on
 * demand, so selecting it across every certificate on an app would turn one
 * query into a lookup per domain.
 */
const HOSTNAME_CHECK_FIELDS = `
  aRecords
  aaaaRecords
  cnameRecords
  caaRecords
  soa
  dnsProvider
  dnsVerificationRecord
  dnsConfigured
  acmeDnsConfigured
  resolvedAddresses
  isProxied
  errors
`;
