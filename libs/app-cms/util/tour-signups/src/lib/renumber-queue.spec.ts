import type { PayloadRequest } from 'payload';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  SKIP_QUEUE_RENUMBER,
  renumberQueue,
  renumberQueueOnChange
} from './renumber-queue';

const find = vi.fn();
const update = vi.fn();

const req = () => ({ payload: { find, update } }) as unknown as PayloadRequest;

describe('renumberQueue', () => {
  beforeEach(() => vi.clearAllMocks());

  it('closes the gap a promotion leaves behind', async () => {
    // #1 was promoted, so the queue is stored as 2 and 3
    find.mockResolvedValue({
      docs: [
        { id: 2, queuePosition: 2 },
        { id: 3, queuePosition: 3 }
      ]
    });

    await renumberQueue(req(), 1);

    expect(update.mock.calls.map((call) => call[0].data)).toEqual([
      { queuePosition: 1 },
      { queuePosition: 2 }
    ]);
  });

  it('keeps the order the guide arranged', async () => {
    find.mockResolvedValue({
      docs: [
        { id: 9, queuePosition: 4 },
        { id: 5, queuePosition: 7 }
      ]
    });

    await renumberQueue(req(), 1);

    expect(update.mock.calls.map((call) => call[0].id)).toEqual([9, 5]);
  });

  it('writes nothing when the queue already counts from one', async () => {
    find.mockResolvedValue({
      docs: [
        { id: 2, queuePosition: 1 },
        { id: 3, queuePosition: 2 }
      ]
    });

    await renumberQueue(req(), 1);

    expect(update).not.toHaveBeenCalled();
  });
});

describe('renumberQueueOnChange', () => {
  type HookArgs = Parameters<typeof renumberQueueOnChange>[0];

  const invoke = (args: Partial<HookArgs>) =>
    renumberQueueOnChange({
      operation: 'update',
      req: req(),
      ...args
    } as HookArgs);

  beforeEach(() => {
    vi.clearAllMocks();
    find.mockResolvedValue({ docs: [] });
  });

  it('runs when a signup leaves the queue', async () => {
    await invoke({
      doc: { id: 1, tour: 3, status: 'booked' } as never,
      previousDoc: { id: 1, tour: 3, status: 'waiting' } as never
    });

    expect(find).toHaveBeenCalled();
  });

  it('runs when a signup joins the queue', async () => {
    await invoke({
      operation: 'create',
      doc: { id: 1, tour: 3, status: 'waiting' } as never
    });

    expect(find).toHaveBeenCalled();
  });

  it('ignores a change that never touched the queue', async () => {
    await invoke({
      doc: { id: 1, tour: 3, status: 'booked' } as never,
      previousDoc: { id: 1, tour: 3, status: 'booked' } as never
    });

    expect(find).not.toHaveBeenCalled();
  });

  it('does not react to writes that set positions deliberately', async () => {
    // Guards two callers: this hook's own writes, which would not terminate,
    // and the reorder endpoint, whose drag it would otherwise undo mid-loop
    await invoke({
      context: { [SKIP_QUEUE_RENUMBER]: true } as never,
      doc: { id: 1, tour: 3, status: 'waiting' } as never,
      previousDoc: { id: 1, tour: 3, status: 'waiting' } as never
    });

    expect(find).not.toHaveBeenCalled();
  });
});
