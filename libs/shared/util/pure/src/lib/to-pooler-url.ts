/**
 * Convert a Supabase direct connection URL to a Session Mode pooler URL.
 *
 * Direct:  postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres
 * Pooler:  postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres
 *
 * The pooler is reachable from more networks and is compatible with pg_dump
 * (unlike Transaction Mode which does not support prepared statements).
 *
 * A URL that is already a pooler URL, or an unrecognised format, is returned
 * unchanged.
 */
export function toPoolerUrl(dbUrl: string, region: string): string {
  const url = new URL(dbUrl);
  const directHostMatch = url.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/);

  if (!directHostMatch) {
    return dbUrl;
  }

  const projectRef = directHostMatch[1];
  url.hostname = `aws-0-${region}.pooler.supabase.com`;
  url.username = `postgres.${projectRef}`;
  return url.toString();
}
