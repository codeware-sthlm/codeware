import { describe, expect, it } from 'vitest';

import { isBlank } from './is-blank';

describe('isBlank', () => {
  it('is true for undefined', () => {
    expect(isBlank(undefined)).toBe(true);
  });

  it('is true for null', () => {
    expect(isBlank(null)).toBe(true);
  });

  it('is true for an empty string', () => {
    expect(isBlank('')).toBe(true);
  });

  it('is true for whitespace only', () => {
    expect(isBlank('   ')).toBe(true);
    expect(isBlank('\t\n')).toBe(true);
  });

  it('is false for a value with content', () => {
    expect(isBlank('a@b.com')).toBe(false);
  });

  it('is false for a value padded with whitespace', () => {
    expect(isBlank('  a@b.com  ')).toBe(false);
  });
});
