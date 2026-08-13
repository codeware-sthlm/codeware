/**
 * One custom domain row on a tenant.
 *
 * Declared structurally rather than pulled from the generated Payload types:
 * the hooks below are the reason the field exists, and typing them against a
 * file that is regenerated from the collection would make the two define each
 * other. The collection is the single source of truth for the shape; this is
 * the slice the hooks read.
 */
export type TenantDomain = {
  /** Domain without a scheme, e.g. `tours.example.com` */
  hostname?: string | null;
  /** Fly app that serves it, e.g. `cdwr-web-moon` */
  app?: string | null;
  /** Whether the app should present itself as this domain */
  isPrimary?: boolean | null;
};

/**
 * A tenant document, as far as the domain hooks are concerned.
 *
 * `id` is not optional: Payload's hook types require it on the document, and
 * hands the hooks a `Partial` of this for the incoming data, which is where a
 * create has no id yet.
 */
export type TenantWithDomains = {
  id: number | string;
  name?: string | null;
  domains?: Array<TenantDomain> | null;
};
