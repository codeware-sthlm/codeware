import { describe, expect, it } from 'vitest';

import {
  type ResolverAnswer,
  normaliseRecords,
  resolversAgree
} from './resolver-comparison';

const answer = (
  resolver: string,
  records: Array<string>,
  error?: string
): ResolverAnswer => ({ resolver, records, error });

describe('normaliseRecords', () => {
  it('ignores case, the root dot and order', () => {
    expect(normaliseRecords(['B.fly.dev.', 'A.FLY.DEV'])).toEqual([
      'a.fly.dev',
      'b.fly.dev'
    ]);
  });

  it('collapses a duplicate rather than reporting it as extra state', () => {
    expect(normaliseRecords(['a.fly.dev', 'a.fly.dev.'])).toEqual([
      'a.fly.dev'
    ]);
  });
});

describe('resolversAgree', () => {
  it('agrees when every resolver returns the same answer', () => {
    expect(
      resolversAgree([
        answer('Cloudflare', ['app.fly.dev']),
        answer('Google', ['app.fly.dev']),
        answer('Quad9', ['app.fly.dev'])
      ])
    ).toBe(true);
  });

  it('disagrees when one resolver still has the old target', () => {
    expect(
      resolversAgree([
        answer('Cloudflare', ['new.fly.dev']),
        answer('Google', ['old.fly.dev'])
      ])
    ).toBe(false);
  });

  it('disagrees when a resolver has nothing and another has an answer', () => {
    // The half-propagated case — the one an operator reads as "broken"
    expect(
      resolversAgree([
        answer('Cloudflare', ['app.fly.dev']),
        answer('Google', [])
      ])
    ).toBe(false);
  });

  it('agrees when every resolver has nothing yet', () => {
    expect(
      resolversAgree([answer('Cloudflare', []), answer('Google', [])])
    ).toBe(true);
  });

  it('ignores a resolver that could not be reached', () => {
    // An unreachable resolver says nothing about the domain, so it must not
    // raise a disagreement the domain is not actually having
    expect(
      resolversAgree([
        answer('Cloudflare', ['app.fly.dev']),
        answer('Google', ['app.fly.dev']),
        answer('Quad9', [], 'ETIMEOUT')
      ])
    ).toBe(true);
  });

  it('reports no disagreement when nothing answered at all', () => {
    expect(
      resolversAgree([
        answer('Cloudflare', [], 'ETIMEOUT'),
        answer('Google', [], 'ECONNREFUSED')
      ])
    ).toBe(true);
  });
});
