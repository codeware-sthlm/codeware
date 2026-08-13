import { describe, expect, it } from 'vitest';

import { matchesDomain } from './match-domain-secret';

const host = 'tours.example.com';

describe('matchesDomain', () => {
  it('matches the url a secret normally holds', () => {
    expect(matchesDomain('https://tours.example.com', host)).toBe(true);
  });

  it('ignores a trailing slash, a port and a path', () => {
    expect(matchesDomain('https://tours.example.com/', host)).toBe(true);
    expect(matchesDomain('https://tours.example.com:443', host)).toBe(true);
    expect(matchesDomain('https://tours.example.com/booking', host)).toBe(true);
  });

  it('matches a bare hostname', () => {
    expect(matchesDomain('tours.example.com', host)).toBe(true);
    expect(matchesDomain('  Tours.Example.COM ', host)).toBe(true);
  });

  it('finds the domain inside a comma-separated list', () => {
    expect(
      matchesDomain(
        'https://a.example.com,https://tours.example.com,https://b.example.com',
        host
      )
    ).toBe(true);
  });

  it('refuses a hostname that merely ends with the domain', () => {
    // The attack this exists to stop: a lookalike host registered elsewhere
    expect(matchesDomain('https://evil-tours.example.com', host)).toBe(false);
    expect(matchesDomain('https://nottours.example.com', host)).toBe(false);
  });

  it('refuses a hostname that merely starts with the domain', () => {
    expect(matchesDomain('https://tours.example.com.evil.net', host)).toBe(
      false
    );
  });

  it('refuses a different domain', () => {
    expect(matchesDomain('https://other.example.com', host)).toBe(false);
  });

  it('refuses nothing at all', () => {
    expect(matchesDomain('', host)).toBe(false);
    expect(matchesDomain(null, host)).toBe(false);
    expect(matchesDomain(undefined, host)).toBe(false);
    expect(matchesDomain('https://tours.example.com', '')).toBe(false);
  });

  it('survives a value that is not a url at all', () => {
    expect(matchesDomain('not a url', host)).toBe(false);
    expect(matchesDomain('true', host)).toBe(false);
  });
});
