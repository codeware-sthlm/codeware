import type { EmailAdapter } from 'payload';
import { describe, expect, it, vi } from 'vitest';

import { SUBMISSION_ID_HEADER } from './attach-submission-id';
import { takeOutcome } from './delivery-outcomes';
import { withSubmissionDeliveryTracking } from './with-submission-delivery-tracking';

const payload = {} as unknown as Parameters<EmailAdapter>[0]['payload'];

/** A minimal adapter, its `sendEmail` swappable per test */
const fakeAdapter =
  (sendEmail: EmailAdapter['sendEmail']): EmailAdapter =>
  () => ({
    name: 'fake',
    defaultFromAddress: 'no-reply@codeware.se',
    defaultFromName: 'Codeware',
    sendEmail
  });

const messageFor = (submissionId?: number) => ({
  to: 'cloud@codeware.se',
  subject: 'New message',
  ...(submissionId != null && {
    headers: { [SUBMISSION_ID_HEADER]: String(submissionId) }
  })
});

const adapterFor = async (sendEmail: EmailAdapter['sendEmail']) => {
  const factory = await Promise.resolve(
    withSubmissionDeliveryTracking(fakeAdapter(sendEmail))
  );
  return factory({ payload });
};

describe('withSubmissionDeliveryTracking', () => {
  it('notes "sent" when a tagged send succeeds', async () => {
    const adapter = await adapterFor(vi.fn().mockResolvedValue({ id: 'ok' }));

    await adapter.sendEmail(messageFor(42));

    expect(takeOutcome(42)).toBe('sent');
  });

  it('notes "failed" and still rethrows when a tagged send fails', async () => {
    const err = new Error('Bad Request');
    const adapter = await adapterFor(vi.fn().mockRejectedValue(err));

    await expect(adapter.sendEmail(messageFor(43))).rejects.toBe(err);

    expect(takeOutcome(43)).toBe('failed');
  });

  it('notes nothing for a message with no submission header', async () => {
    const adapter = await adapterFor(vi.fn().mockResolvedValue({ id: 'ok' }));

    await adapter.sendEmail(messageFor());

    // Every other mail this deployment sends passes through untouched
    expect(takeOutcome(44)).toBeUndefined();
  });

  it('never writes to the database itself', async () => {
    // An adapter has no `req`, so a write from here would land outside the
    // transaction still creating the submission and 404 on a row that does
    // not exist yet — the whole reason the hook does the writing
    const update = vi.fn();
    const withDb = {
      update
    } as unknown as Parameters<EmailAdapter>[0]['payload'];
    const factory = await Promise.resolve(
      withSubmissionDeliveryTracking(
        fakeAdapter(vi.fn().mockResolvedValue({ id: 'ok' }))
      )
    );

    await factory({ payload: withDb }).sendEmail(messageFor(45));

    expect(update).not.toHaveBeenCalled();
    expect(takeOutcome(45)).toBe('sent');
  });
});
