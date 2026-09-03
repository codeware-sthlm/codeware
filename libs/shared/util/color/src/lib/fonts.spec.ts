import { describe, expect, it } from 'vitest';

import {
  DEFAULT_FONTS,
  FONT_FAMILIES,
  type FontSlot,
  fontById,
  fontStack,
  fontsForSlot,
  isRestrictedFont
} from './fonts';

const SLOTS: ReadonlyArray<FontSlot> = ['body', 'heading', 'mono'];

describe('the registry', () => {
  it('has no duplicate ids', () => {
    const ids = FONT_FAMILIES.map((font) => font.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  // `customThemeCss` rejects quotes outright, so a quoted stack would pass
  // every test here and then be dropped at render time, leaving the token empty
  it.each(FONT_FAMILIES)('$id carries an unquoted stack', (font) => {
    expect(font.stack).not.toMatch(/['"]/);
  });

  // Contains rather than ends with: the system stack puts the generic family
  // before the emoji faces on purpose, so those are consulted for emoji
  // codepoints while everything else still has a guaranteed fallback
  it.each(FONT_FAMILIES)('$id carries a generic family', (font) => {
    expect(font.stack.split(',').map((f) => f.trim())).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^(sans-serif|serif|monospace)$/)
      ])
    );
  });

  it.each(SLOTS)('%s has a default that fills it', (slot) => {
    const font = fontById(DEFAULT_FONTS[slot]);
    expect(font?.slots).toContain(slot);
  });

  // A default a tenant cannot be given would make every new theme unsavable
  it.each(SLOTS)('%s default is not restricted', (slot) => {
    expect(isRestrictedFont(DEFAULT_FONTS[slot])).toBe(false);
  });
});

describe('fontsForSlot', () => {
  it('hides a restricted family by default', () => {
    expect(fontsForSlot('heading').map((f) => f.id)).not.toContain(
      'nasalization'
    );
  });

  it('offers it once the gate is open', () => {
    expect(fontsForSlot('heading', true).map((f) => f.id)).toContain(
      'nasalization'
    );
  });

  it('never offers a family for a slot it does not fill', () => {
    expect(fontsForSlot('body', true).map((f) => f.id)).not.toContain(
      'nasalization'
    );
  });

  it.each(SLOTS)('%s offers something without the gate', (slot) => {
    expect(fontsForSlot(slot).length).toBeGreaterThan(0);
  });
});

describe('fontStack', () => {
  it('resolves a known family', () => {
    expect(fontStack('body', 'inter')).toBe(fontById('inter')?.stack);
  });

  // Stored data outlives the registry: a family dropped from the set has to
  // read as the default rather than as an empty token
  it('falls back for an id that no longer exists', () => {
    expect(fontStack('body', 'dropped-family')).toBe(
      fontById(DEFAULT_FONTS.body)?.stack
    );
  });

  it('falls back for a family used in the wrong slot', () => {
    expect(fontStack('body', 'nasalization')).toBe(
      fontById(DEFAULT_FONTS.body)?.stack
    );
  });

  it('falls back for a missing id', () => {
    expect(fontStack('mono', undefined)).toBe(
      fontById(DEFAULT_FONTS.mono)?.stack
    );
  });
});

describe('isRestrictedFont', () => {
  it('reports a licensed family', () => {
    expect(isRestrictedFont('nasalization')).toBe(true);
  });

  it('reports a freely usable one', () => {
    expect(isRestrictedFont('inter')).toBe(false);
  });

  // Unknown is not restricted — it is unknown, and resolves to the default.
  // Reporting it as restricted would refuse a save for the wrong reason
  it('does not treat an unknown family as restricted', () => {
    expect(isRestrictedFont('dropped-family')).toBe(false);
  });
});
