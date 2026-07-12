/** Localized "12 minutes ago"-style label. */
export function formatRelativeTime(iso: string, language: string): string {
  const diffMinutes = Math.round(
    (new Date(iso).getTime() - Date.now()) / 60_000
  );
  const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute');
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  return rtf.format(Math.round(diffHours / 24), 'day');
}
