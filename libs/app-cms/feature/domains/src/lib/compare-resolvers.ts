import { Resolver } from 'node:dns/promises';

import {
  PUBLIC_RESOLVERS,
  type ResolverAnswer,
  type ResolverComparison,
  normaliseRecords,
  resolversAgree
} from './resolver-comparison';

/** Each query is short: this runs while someone waits, three times over */
const QUERY_TIMEOUT_MS = 2500;

const makeResolver = (address: string) => {
  const resolver = new Resolver({ timeout: QUERY_TIMEOUT_MS, tries: 1 });
  resolver.setServers([address]);
  return resolver;
};

/**
 * Ask one resolver, and treat "no answer" as an answer rather than a failure.
 *
 * NXDOMAIN and NODATA are exactly what a caller is here to see — the record
 * has not landed at this resolver yet — so they come back as an empty record
 * list, not an error. Only a resolver that could not be reached at all is an
 * error, because that says nothing about the domain.
 */
const askOne = async (
  { name, address }: { name: string; address: string },
  hostname: string,
  recordType: 'CNAME' | 'A'
): Promise<ResolverAnswer> => {
  try {
    const resolver = makeResolver(address);
    const records =
      recordType === 'CNAME'
        ? await resolver.resolveCname(hostname)
        : await resolver.resolve4(hostname);
    return { resolver: name, records: normaliseRecords(records) };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code ?? '';
    if (code === 'ENOTFOUND' || code === 'ENODATA') {
      return { resolver: name, records: [] };
    }
    return {
      resolver: name,
      records: [],
      error: code || (error instanceof Error ? error.message : String(error))
    };
  }
};

/**
 * The zone's negative-cache ttl, or null when it cannot be read.
 *
 * Deliberately never throws: this is context for the comparison, and losing it
 * should cost the number, not the whole answer.
 */
const readNegativeCacheTtl = async (
  hostname: string
): Promise<number | null> => {
  // The SOA lives on the zone, not on the subdomain, so walk up until one
  // answers — a two-label name is as far as this is worth taking
  const labels = hostname.split('.');
  for (let index = 0; index < labels.length - 1; index++) {
    const zone = labels.slice(index).join('.');
    try {
      const { minttl } = await makeResolver(
        PUBLIC_RESOLVERS[0].address
      ).resolveSoa(zone);
      return minttl;
    } catch {
      // Not the zone apex — try the next label up
    }
  }
  return null;
};

/**
 * What every public resolver currently says about a domain, side by side.
 *
 * Exists because the failure it catches is invisible from anywhere else: a
 * browser reporting NXDOMAIN while Fly, the registrar and every independent
 * resolver already agree on a working answer means the stale copy is on the
 * asker's own side — their router, their ISP, their laptop. Diagnosing that
 * otherwise means running `dig` by hand against a handful of resolvers.
 *
 * Deliberately does *not* query the domain's authoritative nameservers. Three
 * independent resolvers agreeing is already the signal; going to the source
 * would only confirm what they said, at the cost of an NS lookup, an address
 * lookup per nameserver and a third class of failure to explain.
 *
 * @param hostname - The domain to ask about
 * @param isApex - An apex cannot be a CNAME, so its address records are asked
 *   for instead
 */
export const compareResolvers = async (
  hostname: string,
  isApex = false
): Promise<ResolverComparison> => {
  const recordType = isApex ? 'A' : 'CNAME';

  const [answers, negativeCacheTtl] = await Promise.all([
    Promise.all(
      PUBLIC_RESOLVERS.map((resolver) => askOne(resolver, hostname, recordType))
    ),
    readNegativeCacheTtl(hostname)
  ]);

  return {
    hostname,
    recordType,
    answers,
    agree: resolversAgree(answers),
    negativeCacheTtl
  };
};
