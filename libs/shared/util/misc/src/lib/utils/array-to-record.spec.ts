import { arrayToRecord } from './array-to-record';

describe('arrayToRecord', () => {
  it('should return undefined for empty array', () => {
    expect(arrayToRecord([])).toBeUndefined();
  });

  it('should convert simple key=value pairs', () => {
    const input = ['FOO=bar', 'BAZ=qux'];
    const result = arrayToRecord(input);

    expect(result).toEqual({
      FOO: 'bar',
      BAZ: 'qux'
    });
  });

  it('should handle values containing single equals sign', () => {
    const input = ['URL=https://example.com?key=value'];
    const result = arrayToRecord(input);

    expect(result).toEqual({
      URL: 'https://example.com?key=value'
    });
  });

  it('should handle values containing multiple equals signs', () => {
    const input = ['TOKEN=abc==def', 'ENCODED=base64==', 'MULTIPLE=a=b=c=d'];
    const result = arrayToRecord(input);

    expect(result).toEqual({
      TOKEN: 'abc==def',
      ENCODED: 'base64==',
      MULTIPLE: 'a=b=c=d'
    });
  });

  it('should handle Sentry auth token with double equals', () => {
    const input = ['SENTRY_AUTH_TOKEN=sntrys_0ifQ==_WlV'];
    const result = arrayToRecord(input);

    expect(result).toEqual({
      SENTRY_AUTH_TOKEN: 'sntrys_0ifQ==_WlV'
    });
  });

  it('should handle entry without equals sign', () => {
    const input = ['KEY_WITHOUT_VALUE'];
    const result = arrayToRecord(input);

    expect(result).toEqual({
      KEY_WITHOUT_VALUE: ''
    });
  });

  it('should handle mixed entries with and without equals', () => {
    const input = ['FOO=bar', 'STANDALONE', 'BAZ=qux'];
    const result = arrayToRecord(input);

    expect(result).toEqual({
      FOO: 'bar',
      STANDALONE: '',
      BAZ: 'qux'
    });
  });

  it('should handle empty values', () => {
    const input = ['EMPTY=', 'FOO=bar'];
    const result = arrayToRecord(input);

    expect(result).toEqual({
      EMPTY: '',
      FOO: 'bar'
    });
  });

  it('should handle values with special characters', () => {
    const input = [
      'JSON={"key":"value"}',
      'PATH=/usr/local/bin',
      'SPECIAL=!@#$%^&*()'
    ];
    const result = arrayToRecord(input);

    expect(result).toEqual({
      JSON: '{"key":"value"}',
      PATH: '/usr/local/bin',
      SPECIAL: '!@#$%^&*()'
    });
  });

  it('should handle values with newlines and spaces', () => {
    const input = [
      'MULTILINE=line1\\nline2',
      'SPACES=  leading and trailing  '
    ];
    const result = arrayToRecord(input);

    expect(result).toEqual({
      MULTILINE: 'line1\\nline2',
      SPACES: '  leading and trailing  '
    });
  });

  it('should preserve all real-world token formats', () => {
    const input = [
      // Sentry tokens
      'SENTRY_AUTH_TOKEN=sntrys_abc123==def456',
      // Base64 encoded values
      'BASE64_VALUE=SGVsbG8gV29ybGQ=',
      // JWT-like tokens
      'JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature==',
      // Connection strings
      'DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require'
    ];
    const result = arrayToRecord(input);

    expect(result).toEqual({
      SENTRY_AUTH_TOKEN: 'sntrys_abc123==def456',
      BASE64_VALUE: 'SGVsbG8gV29ybGQ=',
      JWT: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature==',
      DATABASE_URL: 'postgresql://user:pass@host:5432/db?sslmode=require'
    });
  });
});
