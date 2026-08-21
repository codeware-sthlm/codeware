import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getEmailAdapter } from './get-email-adapter';

const createTransport = vi.fn().mockReturnValue({ transport: true });
const nodemailerAdapter = vi.fn().mockReturnValue(() => ({}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: (...args: Array<unknown>) => createTransport(...args)
  }
}));
vi.mock('@payloadcms/email-nodemailer', () => ({
  nodemailerAdapter: (...args: Array<unknown>) => nodemailerAdapter(...args)
}));
vi.mock('nodemailer-sendgrid', () => ({ default: vi.fn() }));

/** Minimal env, only what the adapter reads */
const env = (smtp: Record<string, unknown>) =>
  ({
    DEPLOY_ENV: 'preview',
    NX_RUN_TARGET: '',
    EMAIL: {
      smtp: { defaultFromAddress: 'a@b.se', defaultFromName: 'X', ...smtp }
    }
  }) as unknown as Parameters<typeof getEmailAdapter>[0];

/** The options handed to `nodemailer.createTransport` */
const transportOptions = () => createTransport.mock.calls[0][0];
/** The options handed to `nodemailerAdapter` */
const adapterOptions = () => nodemailerAdapter.mock.calls[0][0];

describe('getEmailAdapter — SMTP transport', () => {
  beforeEach(() => {
    createTransport.mockClear();
    nodemailerAdapter.mockClear();
  });

  it('drops TLS for a local catcher, which usually offers none', () => {
    getEmailAdapter(env({ host: 'localhost', port: 1025 }));

    expect(transportOptions()).toMatchObject({
      host: 'localhost',
      port: 1025,
      secure: false,
      ignoreTLS: true
    });
    expect(transportOptions()).not.toHaveProperty('auth');
  });

  it('authenticates a real relay and lets it negotiate STARTTLS', () => {
    getEmailAdapter(
      env({ host: 'sandbox.smtp.mailtrap.io', port: 587, user: 'u', pass: 'p' })
    );

    expect(transportOptions()).toMatchObject({
      host: 'sandbox.smtp.mailtrap.io',
      secure: false,
      auth: { user: 'u', pass: 'p' }
    });
    // Forcing plaintext to a remote relay is what this must never do
    expect(transportOptions()).not.toHaveProperty('ignoreTLS');
  });

  it('still negotiates STARTTLS for an unauthenticated remote relay', () => {
    getEmailAdapter(env({ host: 'relay.example.com', port: 587 }));

    expect(transportOptions()).not.toHaveProperty('ignoreTLS');
    expect(transportOptions()).not.toHaveProperty('auth');
  });

  it('treats a half-configured credential pair as no credentials', () => {
    getEmailAdapter(env({ host: 'relay.example.com', port: 587, user: 'u' }));

    // Authenticating with half a pair would fail in a far more confusing way
    expect(transportOptions()).not.toHaveProperty('auth');
  });

  it('verifies the connection for a relay, but not for a catcher', () => {
    getEmailAdapter(
      env({ host: 'relay.example.com', port: 587, user: 'u', pass: 'p' })
    );
    expect(adapterOptions()).toMatchObject({ skipVerify: false });

    createTransport.mockClear();
    nodemailerAdapter.mockClear();

    getEmailAdapter(env({ host: 'localhost', port: 1025 }));
    expect(adapterOptions()).toMatchObject({ skipVerify: true });
  });
});
