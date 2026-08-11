import { describe, expect, it } from 'vitest';

import { CSV_BOM, csvField, csvRow, toFileSlug } from './csv';

describe('csvField', () => {
  it('quotes every value', () => {
    expect(csvField('Anna')).toBe('"Anna"');
  });

  it('doubles embedded quotes', () => {
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
  });

  it('defuses a value a spreadsheet would evaluate', () => {
    // `=HYPERLINK(...)` in a cell runs on the editor's machine; quoting alone
    // does not stop it, because the reader strips the quotes first
    for (const value of ['=1+1', '+1', '-1', '@SUM(A1)']) {
      expect(csvField(value)).toBe(`"'${value}"`);
    }
  });

  it('defuses a formula hidden behind whitespace', () => {
    expect(csvField(' =1+1')).toBe(`"' =1+1"`);
  });

  it('leaves an ordinary leading character alone', () => {
    expect(csvField('Anna =Berg')).toBe('"Anna =Berg"');
  });
});

describe('csvRow', () => {
  it('joins quoted fields with commas', () => {
    expect(csvRow(['a', 'b,c'])).toBe('"a","b,c"');
  });
});

describe('toFileSlug', () => {
  it('slugs a title', () => {
    expect(toFileSlug('Barolo & Barbaresco Harvest', 'tour')).toBe(
      'barolo-barbaresco-harvest'
    );
  });

  it('falls back when nothing survives', () => {
    // Non-ASCII titles are exactly why the caller also appends the id
    expect(toFileSlug('日本の旅', 'tour')).toBe('tour');
  });
});

describe('CSV_BOM', () => {
  it('is the byte order mark Excel needs to read UTF-8', () => {
    expect(CSV_BOM).toBe('﻿');
    expect(CSV_BOM).toHaveLength(1);
  });
});
