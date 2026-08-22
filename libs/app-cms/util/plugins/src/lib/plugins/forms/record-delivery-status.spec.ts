import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordOutcome } from './delivery-outcomes';
import { recordDeliveryStatus } from './record-delivery-status';

type HookArgs = Parameters<typeof recordDeliveryStatus>[0];

const update = vi.fn().mockResolvedValue(undefined);
const findByID = vi.fn();
const logger = { error: vi.fn(), warn: vi.fn() };
const req = { payload: { update, findByID, logger }, transactionID: 'tx-1' };

const invoke = (
  id: number,
  { form = 100, operation = 'create' as 'create' | 'update' } = {}
) =>
  recordDeliveryStatus({
    doc: { id, form },
    operation,
    req
  } as unknown as HookArgs);

describe('recordDeliveryStatus', () => {
  beforeEach(() => {
    update.mockClear();
    findByID.mockClear();
    logger.error.mockClear();
    logger.warn.mockClear();
    // A form with notification emails, unless a test overrides it
    findByID.mockResolvedValue({ id: 100, emails: [{ emailTo: 'a@b.com' }] });
  });

  it('writes the noted outcome inside the creating transaction', async () => {
    recordOutcome(1, 'failed');

    await invoke(1);

    // `req` carries the transaction the submission was created in — without
    // it the row is not visible yet and the update 404s
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'form-submissions',
        id: 1,
        data: { notificationStatus: 'failed' },
        overrideAccess: true,
        req
      })
    );
    expect(findByID).not.toHaveBeenCalled();
  });

  it('writes "not-configured" when the form has no notification emails', async () => {
    findByID.mockResolvedValue({ id: 100, emails: [] });

    await invoke(2);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { notificationStatus: 'not-configured' }
      })
    );
  });

  it('writes nothing but logs when the form has emails but left no outcome', async () => {
    // beforeEmail never ran or never recorded anything — an abnormal case,
    // not one to paper over with a status that did not happen, but one
    // worth being able to find in the logs
    await invoke(3);

    expect(update).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });

  it('consumes the outcome, so re-running on its own update is a no-op', async () => {
    recordOutcome(4, 'sent');

    await invoke(4);
    expect(update).toHaveBeenCalledTimes(1);

    // The write above re-triggers this hook; nothing is left to write, and
    // the form still has emails so it does not fall back to not-configured
    await invoke(4, { operation: 'update' });
    await invoke(4);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('only acts on create', async () => {
    recordOutcome(5, 'sent');

    await invoke(5, { operation: 'update' });

    expect(update).not.toHaveBeenCalled();
  });

  it('logs rather than failing the visitor’s request when the write fails', async () => {
    recordOutcome(6, 'failed');
    update.mockRejectedValueOnce(new Error('db unavailable'));

    await expect(invoke(6)).resolves.toBeDefined();
    expect(logger.error).toHaveBeenCalled();
  });
});
