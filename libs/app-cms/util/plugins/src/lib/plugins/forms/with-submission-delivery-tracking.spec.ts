import type { EmailAdapter } from 'payload';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SUBMISSION_ID_HEADER } from './attach-submission-id';
import { withSubmissionDeliveryTracking } from './with-submission-delivery-tracking';

const update = vi.fn().mockResolvedValue(undefined);
const logger = { error: vi.fn() };
const payload = {
  update,
  logger
} as unknown as Parameters<EmailAdapter>[0]['payload'];

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

describe('withSubmissionDeliveryTracking', () => {
  beforeEach(() => {
    update.mockClear();
    logger.error.mockClear();
  });

  it('records "sent" when a tagged send succeeds', async () => {
    const sendEmail = vi.fn().mockResolvedValue({ id: 'ok' });
    const factory = await Promise.resolve(
      withSubmissionDeliveryTracking(fakeAdapter(sendEmail))
    );

    await factory({ payload }).sendEmail(messageFor(42));

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'form-submissions',
        id: 42,
        data: { notificationStatus: 'sent' },
        overrideAccess: true
      })
    );
  });

  it('records "failed" and still rethrows when a tagged send fails', async () => {
    const err = new Error('Bad Request');
    const sendEmail = vi.fn().mockRejectedValue(err);
    const factory = await Promise.resolve(
      withSubmissionDeliveryTracking(fakeAdapter(sendEmail))
    );

    await expect(factory({ payload }).sendEmail(messageFor(42))).rejects.toBe(
      err
    );

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 42,
        data: { notificationStatus: 'failed' }
      })
    );
  });

  it('ignores a message with no submission header', async () => {
    const sendEmail = vi.fn().mockResolvedValue({ id: 'ok' });
    const factory = await Promise.resolve(
      withSubmissionDeliveryTracking(fakeAdapter(sendEmail))
    );

    await factory({ payload }).sendEmail(messageFor());

    expect(update).not.toHaveBeenCalled();
  });

  it('does not let a failed record-write mask the real send error', async () => {
    const sendErr = new Error('Bad Request');
    const sendEmail = vi.fn().mockRejectedValue(sendErr);
    update.mockRejectedValueOnce(new Error('db unavailable'));
    const factory = await Promise.resolve(
      withSubmissionDeliveryTracking(fakeAdapter(sendEmail))
    );

    await expect(factory({ payload }).sendEmail(messageFor(42))).rejects.toBe(
      sendErr
    );
    expect(logger.error).toHaveBeenCalled();
  });
});
