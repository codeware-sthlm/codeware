/**
 * Types and pure comparison rules for the resolver report.
 *
 * Deliberately free of `node:dns`: this module is reachable from the domains
 * barrel, which client components import, and a node builtin in that graph
 * breaks the browser bundle. The querying half lives behind the `/server`
 * entry point, which only the endpoint imports.
 */

/** Public resolvers queried side by side, by the name a person would recognise */
export const PUBLIC_RESOLVERS = [
  { name: 'Cloudflare', address: '1.1.1.1' },
  { name: 'Google', address: '8.8.8.8' },
  { name: 'Quad9', address: '9.9.9.9' }
] as const;

/** One resolver's answer, or the reason it did not give one */
export type ResolverAnswer = {
  resolver: string;
  /** What it resolved, sorted and lowercased so two answers compare directly */
  records: Array<string>;
  /** Set when the query failed or timed out, in which case `records` is empty */
  error?: string;
};

export type ResolverComparison = {
  hostname: string;
  /** Which record type was asked for, decided by whether the domain is an apex */
  recordType: 'CNAME' | 'A';
  answers: Array<ResolverAnswer>;
  /**
   * Whether every resolver that answered agreed.
   *
   * `false` is the interesting case, and the reason this exists: resolvers
   * disagreeing means the record is mid-propagation or something between the
   * asker and the internet is holding a stale copy — not that the record is
   * wrong. Resolvers that failed outright do not count as disagreement.
   */
  agree: boolean;
  /**
   * The zone's negative-cache ttl in seconds, from its SOA.
   *
   * How long a "this does not exist" answer can legitimately stick around
   * after the record is created. Turns "try waiting a bit" into a number.
   */
  negativeCacheTtl: number | null;
};

/**
 * Whether every resolver that actually answered gave the same answer.
 *
 * Resolvers that could not be reached are ignored rather than counted as
 * disagreement — an unreachable resolver says nothing about the domain, and
 * letting one time out would otherwise raise a false alarm.
 *
 * Vacuously true when nobody answered: there is no disagreement to report,
 * and the per-resolver errors already say what went wrong.
 */
export const resolversAgree = (answers: Array<ResolverAnswer>): boolean => {
  const answered = answers.filter((answer) => !answer.error);
  const first = answered.at(0);
  return (
    !first ||
    answered.every(
      (answer) => answer.records.join(',') === first.records.join(',')
    )
  );
};

/**
 * Put two resolvers' answers into a form that compares directly.
 *
 * Case and the trailing root dot are presentation, and record order is not
 * meaningful — leaving any of them in would report a disagreement between two
 * resolvers saying the same thing.
 */
export const normaliseRecords = (records: Array<string>): Array<string> =>
  [
    ...new Set(records.map((record) => record.toLowerCase().replace(/\.$/, '')))
  ].sort();
