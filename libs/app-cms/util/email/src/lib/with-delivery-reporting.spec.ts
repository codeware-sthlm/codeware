import * as Sentry from '@sentry/nextjs';
import type { EmailAdapter } from 'payload';
import { describe, expect, it, vi } from 'vitest';

import { withDeliveryReporting } from './with-delivery-reporting';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

const logger = { error: vi.fn() };
const payload = { logger } as unknown as Parameters<EmailAdapter>[0]['payload'];

/** A minimal adapter, its `sendEmail` swappable per test */
const fakeAdapter =
  (sendEmail: EmailAdapter['sendEmail']): EmailAdapter =>
  () => ({
    name: 'fake',
    defaultFromAddress: 'no-reply@codeware.se',
    defaultFromName: 'Codeware',
    sendEmail
  });

const message = { to: 'cloud@codeware.se', subject: 'New message' };

describe('withDeliveryReporting', () => {
  it('passes a successful send through untouched', async () => {
    const sendEmail = vi.fn().mockResolvedValue({ id: 'sent' });
    const factory = await Promise.resolve(
      withDeliveryReporting(fakeAdapter(sendEmail))
    );

    const adapter = factory({ payload });
    await expect(adapter.sendEmail(message)).resolves.toEqual({ id: 'sent' });
    expect(logger.error).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('logs, reports to Sentry, and rethrows on a failed send', async () => {
    const err = new Error('Bad Request');
    const sendEmail = vi.fn().mockRejectedValue(err);
    const factory = await Promise.resolve(
      withDeliveryReporting(fakeAdapter(sendEmail))
    );

    const adapter = factory({ payload });
    await expect(adapter.sendEmail(message)).rejects.toBe(err);

    expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ err }));
    expect(Sentry.captureException).toHaveBeenCalledWith(
      err,
      expect.objectContaining({ tags: { emailTransport: 'fake' } })
    );
  });

  it('preserves the adapter identity fields', async () => {
    const factory = await Promise.resolve(
      withDeliveryReporting(fakeAdapter(vi.fn()))
    );
    const adapter = factory({ payload });

    expect(adapter).toMatchObject({
      name: 'fake',
      defaultFromAddress: 'no-reply@codeware.se',
      defaultFromName: 'Codeware'
    });
  });

  it('wraps an adapter that resolves asynchronously', async () => {
    const err = new Error('down');
    const sendEmail = vi.fn().mockRejectedValue(err);
    const asyncAdapter = Promise.resolve(fakeAdapter(sendEmail));

    const factory = await Promise.resolve(withDeliveryReporting(asyncAdapter));
    const adapter = factory({ payload });

    await expect(adapter.sendEmail(message)).rejects.toBe(err);
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});
