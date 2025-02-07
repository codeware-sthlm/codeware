import { z } from 'zod';

import { withEnvVars } from './with-env-vars.preprocess';

describe('withEnvVars', () => {
  let originalTestApiUrl: string | undefined;
  let originalTestKey: string | undefined;
  beforeAll(() => {
    originalTestApiUrl = process.env['TEST_API_URL'];
    originalTestKey = process.env['TEST_KEY'];
  });

  beforeEach(() => {
    process.env['TEST_API_URL'] = 'https://api.example.com';
    process.env['TEST_KEY'] = 'k3y';
  });

  afterEach(() => {
    if (originalTestApiUrl) {
      process.env['TEST_API_URL'] = originalTestApiUrl;
    } else {
      delete process.env['TEST_API_URL'];
    }
    if (originalTestKey) {
      process.env['TEST_KEY'] = originalTestKey;
    } else {
      delete process.env['TEST_KEY'];
    }
  });

  it('should apply to object without options', () => {
    const schema = withEnvVars(
      z.object({
        apiUrl: z.string().url(),
        secret: z.string()
      })
    );

    expect(
      schema.parse({ apiUrl: '{TEST_API_URL}', secret: 'my-{TEST_KEY}' })
    ).toEqual({
      apiUrl: 'https://api.example.com',
      secret: 'my-k3y'
    });
  });

  it('should apply to a property of an object with options', () => {
    const schema = z.object({
      apiUrl: withEnvVars(z.string().url(), { prefix: 'TEST_' }),
      secret: z.string()
    });

    expect(
      schema.parse({ apiUrl: '{API_URL}', secret: 'my-{TEST_KEY}' })
    ).toEqual({
      apiUrl: 'https://api.example.com',
      secret: 'my-{TEST_KEY}'
    });
  });

  it('should support $ in the environment variables', () => {
    const schema = withEnvVars(
      z.object({
        apiUrl: z.string().url(),
        secret: z.string()
      })
    );

    expect(
      schema.parse({ apiUrl: '${TEST_API_URL}', secret: 'my-${TEST_KEY}' })
    ).toEqual({
      apiUrl: 'https://api.example.com',
      secret: 'my-k3y'
    });
  });

  it('should throw an error if environment variable is not found', () => {
    const schema = withEnvVars(
      z.object({
        apiUrl: z.string().url(),
        secret: z.string()
      }),
      {
        throwOnMissing: true
      }
    );

    expect(() =>
      schema.parse({ apiUrl: '{API_URL}', secret: 'my-{TEST_KEY}' })
    ).toThrow();
  });

  it('should use a default value if the environment variable is not found', () => {
    const schema = withEnvVars(
      z.object({
        apiUrl: z.string().url(),
        secret: z.string()
      }),
      {
        defaultValue: 'http://localhost:3000'
      }
    );

    expect(
      schema.parse({ apiUrl: '{API_URL}', secret: 'my-{TEST_KEY}' })
    ).toEqual({
      apiUrl: 'http://localhost:3000',
      secret: 'my-k3y'
    });
  });

  it('should treat undefined as normal value', () => {
    process.env['TEST_API_URL'] = undefined;
    const schema = withEnvVars(
      z.object({
        apiUrl: z.string()
      })
    );

    expect(schema.parse({ apiUrl: '${TEST_API_URL}' })).toEqual({
      apiUrl: 'undefined'
    });
  });

  it('should treat undefined as an empty string', () => {
    process.env['TEST_API_URL'] = undefined;
    const schema = withEnvVars(
      z.object({
        apiUrl: z.string()
      }),
      {
        undefinedIsEmpty: true
      }
    );

    expect(schema.parse({ apiUrl: '${TEST_API_URL}' })).toEqual({
      apiUrl: ''
    });
  });

  it('should use a prefix to match environment variable', () => {
    const schema = withEnvVars(
      z.object({
        apiUrl: z.string().url()
      }),
      { prefix: 'TEST_' }
    );

    expect(schema.parse({ apiUrl: '{API_URL}' })).toEqual({
      apiUrl: 'https://api.example.com'
    });
  });
});
