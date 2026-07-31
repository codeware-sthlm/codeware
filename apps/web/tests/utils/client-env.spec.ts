import { getClientEnv } from '../../app/utils/client-env';

vi.mock('../../env-resolver/env', () => ({
  default: {
    NODE_ENV: 'production',
    DEPLOY_ENV: 'production',
    PAYLOAD_URL: 'https://cms.example.com',
    TENANT_ID: 'acme',
    PORT: 3001,
    DEBUG: false,
    // Server-only — must never reach the browser
    PAYLOAD_API_KEY: 'server-only-api-key',
    SIGNATURE_SECRET: 'server-only-signature-secret'
  }
}));

describe('getClientEnv', () => {
  it('should expose exactly the values the browser needs', () => {
    expect(getClientEnv()).toEqual({
      PAYLOAD_URL: 'https://cms.example.com',
      TENANT_ID: 'acme'
    });
  });

  // The root loader serializes this into the HTML, so a widened projection
  // would publish whatever it picks up to every visitor
  it('should not carry any server-only secret', () => {
    const serialized = JSON.stringify(getClientEnv());

    expect(serialized).not.toContain('server-only-api-key');
    expect(serialized).not.toContain('server-only-signature-secret');
  });
});
