import { describe, expect, it } from 'vitest';

import { type HostnameProblem, parseHostname } from './parse-hostname';

const accepts = (value: string, expected = value) =>
  expect(parseHostname(value)).toEqual({ valid: true, hostname: expected });

const rejects = (value: string, problem: HostnameProblem) =>
  expect(parseHostname(value)).toEqual({ valid: false, problem });

describe('parseHostname', () => {
  it('accepts a subdomain and an apex alike', () => {
    accepts('tours.example.com');
    accepts('example.com');
    accepts('a.b.c.d.example.com');
  });

  it('normalizes case and surrounding space', () => {
    accepts('  Tours.Example.COM  ', 'tours.example.com');
  });

  it('drops a trailing dot', () => {
    // Otherwise the same domain could be stored twice, differing invisibly
    accepts('tours.example.com.', 'tours.example.com');
  });

  it('accepts hyphens and digits inside a label', () => {
    accepts('my-tours-2026.example.com');
  });

  it('refuses a pasted url by naming the scheme, not the slash', () => {
    rejects('https://tours.example.com', 'hasScheme');
    rejects('http://tours.example.com/', 'hasScheme');
  });

  it('refuses a path, query or fragment', () => {
    rejects('tours.example.com/booking', 'hasPath');
    rejects('tours.example.com?a=1', 'hasPath');
    rejects('tours.example.com#top', 'hasPath');
  });

  it('refuses a port', () => {
    rejects('tours.example.com:3000', 'hasPort');
  });

  it('refuses a wildcard', () => {
    // Would need a DNS-01 challenge, and with it control of the customer's dns
    rejects('*.example.com', 'isWildcard');
  });

  it('refuses an empty value', () => {
    rejects('', 'empty');
    rejects('   ', 'empty');
  });

  it('refuses a single label', () => {
    rejects('localhost', 'tooFewLabels');
    rejects('example.', 'tooFewLabels');
  });

  it('refuses a hyphen at the edge of a label', () => {
    rejects('-tours.example.com', 'invalidLabel');
    rejects('tours-.example.com', 'invalidLabel');
  });

  it('refuses an empty label', () => {
    rejects('tours..example.com', 'invalidLabel');
    rejects('.example.com', 'invalidLabel');
  });

  it('refuses an underscore, which dns records use but hostnames may not', () => {
    rejects('_acme-challenge.example.com', 'invalidLabel');
  });

  it('refuses a label over 63 characters', () => {
    accepts(`${'a'.repeat(63)}.example.com`);
    rejects(`${'a'.repeat(64)}.example.com`, 'invalidLabel');
  });

  it('refuses a name over 253 characters', () => {
    const label = `${'a'.repeat(63)}.`;

    rejects(`${label.repeat(4)}example.com`, 'tooLong');
  });

  it('refuses an ip address', () => {
    // Passes every label rule, and is not something Let's Encrypt will issue
    rejects('192.168.1.1', 'numericTld');
  });

  it('refuses non-ascii rather than guessing at punycode', () => {
    // Silently accepting it would store a name Fly cannot match
    rejects('resor.exämple.com', 'invalidLabel');
  });
});
