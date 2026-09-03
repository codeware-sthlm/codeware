/**
 * The typefaces a theme may choose from.
 *
 * A curated set rather than free text, for a reason that is structural rather
 * than editorial: a theme token can only ever *name* a family, and the bytes
 * are declared per app in `_core/fonts.css`. A family nobody has declared
 * renders as its fallback, silently. Offering only what is declared is what
 * keeps the picker honest.
 *
 * Lives beside `palette.ts`, which is the same shape — a registry of families
 * plus the lookups that resolve one.
 */

/** Where a family can be used. A display face has no business as body text. */
export type FontSlot = 'body' | 'heading' | 'mono';

export type FontFamily = {
  /** Stored in the recipe; never shown */
  id: string;
  /** Shown in the picker */
  label: string;
  /**
   * The full CSS stack, unquoted.
   *
   * Unquoted is not a style choice: `customThemeCss` rejects quotes, so this
   * is the only form a runtime theme can carry, and keeping committed themes
   * on the same string means the two cannot drift.
   */
  stack: string;
  /** Which slots the family is offered for */
  slots: ReadonlyArray<FontSlot>;
  /**
   * Licensed to Codeware rather than freely redistributable.
   *
   * Only a system user may assign one. The studio hides it, and the collection
   * refuses it — the UI half makes it discoverable, the server half makes it
   * true.
   */
  restricted?: true;
};

const SYSTEM_SANS =
  'ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji';

const SYSTEM_MONO =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace';

export const FONT_FAMILIES: ReadonlyArray<FontFamily> = [
  {
    id: 'inter',
    label: 'Inter',
    // `Inter Variable` is what `@fontsource-variable/inter` declares; plain
    // `Inter` covers a reader who has it installed, and apps/web, which still
    // loads it from Google
    stack: 'Inter Variable, Inter, sans-serif',
    slots: ['body', 'heading']
  },
  {
    id: 'system',
    label: 'System',
    stack: SYSTEM_SANS,
    slots: ['body', 'heading']
  },
  {
    id: 'mono',
    label: 'System mono',
    stack: SYSTEM_MONO,
    slots: ['mono']
  },
  {
    id: 'nasalization',
    label: 'Nasalization',
    // Headings only — a display face at body size is unreadable, and the
    // licence is for Codeware's own branding rather than general text
    stack: 'Nasalization, Inter Variable, Inter, sans-serif',
    slots: ['heading'],
    restricted: true
  }
];

/** What a theme falls back to, and what a new one starts from. */
export const DEFAULT_FONTS: Record<FontSlot, string> = {
  body: 'inter',
  heading: 'inter',
  mono: 'mono'
};

const byId = new Map(FONT_FAMILIES.map((font) => [font.id, font]));

/** Resolve a family by id, or `undefined` for one no longer offered. */
export const fontById = (id: string): FontFamily | undefined => byId.get(id);

/**
 * The families offered for a slot.
 *
 * @param slot - Which slot the picker is filling
 * @param canUseRestricted - Whether the acting user may assign a licensed face
 */
export const fontsForSlot = (
  slot: FontSlot,
  canUseRestricted = false
): ReadonlyArray<FontFamily> =>
  FONT_FAMILIES.filter(
    (font) =>
      font.slots.includes(slot) && (canUseRestricted || !font.restricted)
  );

/**
 * Whether assigning this family needs the system-user gate.
 *
 * An unknown id is not restricted — it is simply unknown, and resolves to the
 * default elsewhere. Reporting it as restricted would blame the wrong thing.
 */
export const isRestrictedFont = (id: string): boolean =>
  fontById(id)?.restricted === true;

/** The stack a slot resolves to, falling back when the id is unknown. */
export const fontStack = (slot: FontSlot, id: string | undefined): string => {
  const font = id ? fontById(id) : undefined;
  const usable = font?.slots.includes(slot) ? font : undefined;

  return (usable ?? fontById(DEFAULT_FONTS[slot]))?.stack ?? SYSTEM_SANS;
};
