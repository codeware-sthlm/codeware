import { beforeEach, describe, expect, it, vi } from 'vitest';

import { recordOutcome } from './delivery-outcomes';
import { recordDeliveryStatus } from './record-delivery-status';

type HookArgs = Parameters<typeof recordDeliveryStatus>[0];

const update = vi.fn().mockResolvedValue(undefined);
const logger = { error: vi.fn() };
const req = { payload: { update, logger }, transactionID: 'tx-1' };

const invoke = (id: number, operation: 'create' | 'update' = 'create') =>
  recordDeliveryStatus({
    doc: { id },
    operation,
    req
  } as unknown as HookArgs);

describe('recordDeliveryStatus', () => {
  beforeEach(() => {
    update.mockClear();
    logger.error.mockClear();
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
  });

  it('writes nothing when no send was attempted', async () => {
    // A form with no notification emails configured is a normal arrangement
    await invoke(2);

    expect(update).not.toHaveBeenCalled();
  });

  it('consumes the outcome, so re-running on its own update is a no-op', async () => {
    recordOutcome(3, 'sent');

    await invoke(3);
    expect(update).toHaveBeenCalledTimes(1);

    // The write above re-triggers this hook; nothing is left to write
    await invoke(3, 'update');
    await invoke(3);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('only acts on create', async () => {
    recordOutcome(4, 'sent');

    await invoke(4, 'update');

    expect(update).not.toHaveBeenCalled();
  });

  it('logs rather than failing the visitor’s request when the write fails', async () => {
    recordOutcome(5, 'failed');
    update.mockRejectedValueOnce(new Error('db unavailable'));

    await expect(invoke(5)).resolves.toBeDefined();
    expect(logger.error).toHaveBeenCalled();
  });
});
