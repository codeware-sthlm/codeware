/**
 * Excel reads a UTF-8 csv as latin-1 unless it starts with a byte order mark.
 *
 * Written as an escape on purpose — the literal character is invisible in an
 * editor and in review, so it is trivially lost to a stray edit.
 */
export const CSV_BOM = '\ufeff';

/**
 * A value a spreadsheet would read as the start of a formula.
 *
 * Leading whitespace is skipped before the trigger character: importers differ
 * in whether they trim a cell before writing it, so `" =1+1"` is treated as
 * dangerous rather than trusting any one of them to leave the space in place.
 */
const FORMULA_LEAD = /^\s*[=+\-@]/;

/**
 * RFC 4180 field: always quoted, embedded quotes doubled.
 *
 * Exports here are built from values anonymous visitors submitted and are
 * meant to be opened in Excel, so anything that looks like a formula is
 * prefixed with an apostrophe first. Quoting alone is no defence — the reader
 * strips the quotes and still evaluates `=…`, which is how a submitted
 * `=HYPERLINK(…)` would run on the editor's machine. Excel treats the
 * apostrophe as "this is text" and does not display it.
 */
export const csvField = (value: string): string => {
  const safe = FORMULA_LEAD.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
};

/** One csv line from already-stringified values */
export const csvRow = (values: Array<string>): string =>
  values.map(csvField).join(',');

/**
 * Filename-safe slug of a document title, so downloads don't all collide.
 *
 * @param title - Title to slugify
 * @param fallback - Used when the title has no usable characters
 */
export function toFileSlug(title: string, fallback: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || fallback;
}
