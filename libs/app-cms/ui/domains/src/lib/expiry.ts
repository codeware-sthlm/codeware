/**
 * How close an expiry has to be before it is worth saying out loud.
 *
 * Fly renews automatically, so this is not a deadline — it is the window in
 * which a renewal that has quietly stopped working becomes visible while
 * there is still time to fix the dns behind it.
 */
export const EXPIRY_WARNING_DAYS = 14;

/**
 * Whether a certificate expires soon enough to flag.
 *
 * An already-expired certificate counts: it is the same problem, later.
 *
 * @param expiresAt - ISO timestamp, or nothing when no expiry is known
 * @param now - Injectable clock, so a test can pin the window
 */
export const isExpiringSoon = (
  expiresAt: string | null | undefined,
  now: Date = new Date()
): boolean => {
  if (!expiresAt) {
    return false;
  }
  const remaining = new Date(expiresAt).getTime() - now.getTime();
  return (
    Number.isFinite(remaining) &&
    remaining < EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000
  );
};
