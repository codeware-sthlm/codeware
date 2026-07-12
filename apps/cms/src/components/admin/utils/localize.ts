/** Pick a string from a locale map using the current language, falling back to 'en'. */
export function localize(value: unknown, lang: string, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    const map = value as Record<string, string>;
    return map[lang] ?? map['en'] ?? fallback;
  }
  return fallback;
}
