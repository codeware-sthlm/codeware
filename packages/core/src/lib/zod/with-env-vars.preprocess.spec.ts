import { z } from 'zod';

import { withEnvVars } from './with-env-vars.preprocess';

describe('withEnvVars', () => {
  let originalTestEnvVar: string | undefined;

  beforeAll(() => {
    originalTestEnvVar = process.env['TEST_API_URL'];
  });

  beforeEach(() => {
    process.env['TEST_API_URL'] = 'https://api.example.com';
  });

  afterEach(() => {
    if (originalTestEnvVar) {
      process.env['TEST_API_URL'] = originalTestEnvVar;
    } else {
      delete process.env['TEST_API_URL'];
    }
  });

  it('should replace correctly without options', () => {
    const schema = z.object({
      apiUrl: withEnvVars(z.string().url())
    });

    expect(schema.parse({ apiUrl: '{TEST_API_URL}' })).toEqual({
      apiUrl: 'https://api.example.com'
    });
  });

  it('should support $ in the environment variables', () => {
    const schema = z.object({
      apiUrl: withEnvVars(z.string().url())
    });

    expect(schema.parse({ apiUrl: '${TEST_API_URL}' })).toEqual({
      apiUrl: 'https://api.example.com'
    });
  });

  it('should throw an error if the environment variable is not found', () => {
    const schema = z.object({
      apiUrl: withEnvVars(z.string().url())
    });

    expect(() => schema.parse({ apiUrl: '{API_URL}' })).toThrow();
  });

  it('should use a default value if the environment variable is not found', () => {
    const schema = z.object({
      apiUrl: withEnvVars(z.string().url(), {
        defaultValue: 'http://localhost:3000'
      })
    });

    expect(schema.parse({ apiUrl: '{API_URL}' })).toEqual({
      apiUrl: 'http://localhost:3000'
    });
  });

  it('should treat undefined as normal value', () => {
    process.env['TEST_API_URL'] = undefined;
    const schema = z.object({
      apiUrl: withEnvVars(z.string())
    });

    expect(schema.parse({ apiUrl: '${TEST_API_URL}' })).toEqual({
      apiUrl: 'undefined'
    });
  });

  it('should treat undefined as an empty string', () => {
    process.env['TEST_API_URL'] = undefined;
    const schema = z.object({
      apiUrl: withEnvVars(z.string(), { undefinedIsEmpty: true })
    });

    expect(schema.parse({ apiUrl: '${TEST_API_URL}' })).toEqual({
      apiUrl: ''
    });
  });

  it('should use a prefix to match environment variable', () => {
    const schema = z.object({
      apiUrl: withEnvVars(z.string().url(), { prefix: 'TEST_' })
    });

    expect(schema.parse({ apiUrl: '{API_URL}' })).toEqual({
      apiUrl: 'https://api.example.com'
    });
  });
});
