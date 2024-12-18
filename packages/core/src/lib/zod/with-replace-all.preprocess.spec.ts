import { z } from 'zod';

import { withReplaceAll } from './with-replace-all.preprocess';

describe('withReplaceAll', () => {
  it('should passthrough empty strings', () => {
    const schema = z.string();
    const transformed = withReplaceAll(schema, { match: 'foo', value: 'bar' });
    expect(transformed.parse('')).toEqual('');
  });

  it('should passthrough undefined', () => {
    const schema = z.string().optional();
    const transformed = withReplaceAll(schema, { match: 'foo', value: 'bar' });
    expect(transformed.parse(undefined)).toEqual(undefined);
  });

  it('should passthrough null', () => {
    const schema = z.string().nullable();
    const transformed = withReplaceAll(schema, { match: 'foo', value: 'bar' });
    expect(transformed.parse(null)).toEqual(null);
  });

  it('should passthrough when the value is not a string', () => {
    const schema = z.object({
      foo: z.string()
    });
    const transformed = withReplaceAll(schema, { match: 'foo', value: 'bar' });
    expect(transformed.parse({ foo: 'foo' })).toEqual({ foo: 'foo' });
  });

  it('should replace with empty string when value is undefined and strict is false', () => {
    const schema = z.string();
    const transformed = withReplaceAll(schema, {
      match: 'foo',
      value: undefined
    });
    expect(transformed.parse('foo')).toEqual('');
  });

  it('should passthrough when value is undefined and strict is true', () => {
    const schema = z.string();
    const transformed = withReplaceAll(schema, {
      match: 'foo',
      value: undefined,
      strict: true
    });
    expect(transformed.parse('foo')).toEqual('foo');
  });

  it('should replace a single occurrence', () => {
    const schema = z.string();
    const transformed = withReplaceAll(schema, { match: 'bar', value: 'foo' });
    expect(transformed.parse('foo bar foo')).toEqual('foo foo foo');
  });

  it('should replace multiple occurrences', () => {
    const schema = z.string();
    const transformed = withReplaceAll(schema, { match: 'foo', value: 'bar' });
    expect(transformed.parse('foo foo foo')).toEqual('bar bar bar');
  });

  it('should replace with a number', () => {
    const schema = z.string();
    const transformed = withReplaceAll(schema, {
      match: 'number',
      value: 123
    });
    expect(transformed.parse('number')).toEqual('123');
  });

  it('should replace special characters', () => {
    const schema = z.string().url();
    const transformed = withReplaceAll(schema, {
      match: '[PR_NUMBER]',
      value: 123
    });
    expect(transformed.parse('https://gh-[PR_NUMBER].io')).toEqual(
      'https://gh-123.io'
    );
  });
});
