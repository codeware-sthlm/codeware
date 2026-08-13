import { parseHostname } from './parse-hostname';

/**
 * Whether a stored secret value points at this hostname.
 *
 * Secrets hold urls (`https://tours.example.com`), sometimes several separated
 * by commas, and sometimes with a trailing slash or a port. A plain substring
 * test would match `tours.example.com` inside `nottours.example.com` and inside
 * `tours.example.com.evil.net`, so each candidate is reduced to its host and
 * compared whole.
 *
 * @param value - The secret's value, possibly a comma-separated list
 * @param hostname - Normalized hostname from the domain row
 */
export const matchesDomain = (
  value: string | null | undefined,
  hostname: string
): boolean => {
  if (!value || !hostname) {
    return false;
  }

  return value
    .split(',')
    .map((entry) => hostOf(entry))
    .some((host) => host === hostname);
};

/** The host part of a url, or of a bare hostname */
const hostOf = (value: string): string | null => {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  // `URL` handles the scheme, port, path and trailing slash in one step, and
  // is the same parser a browser applies to these values later on
  try {
    return new URL(trimmed).hostname.toLowerCase();
  } catch {
    // Not a url — a bare hostname is a legitimate way to write one of these
    const parsed = parseHostname(trimmed);

    return parsed.valid ? parsed.hostname : null;
  }
};
