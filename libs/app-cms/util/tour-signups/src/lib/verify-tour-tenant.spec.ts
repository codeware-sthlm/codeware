import type { TourSignup } from '@codeware/shared/util/payload-types';
import { describe, expect, it, vi } from 'vitest';

import { verifyTourTenant } from './verify-tour-tenant';

type HookArgs = Parameters<typeof verifyTourTenant>[0];

const invoke = (
  data: Partial<TourSignup> | null,
  findByID: ReturnType<typeof vi.fn>,
  operation: 'create' | 'update' = 'create'
) =>
  verifyTourTenant({
    data,
    operation,
    req: { payload: { findByID } }
  } as unknown as HookArgs);

/** Tour owned by tenant 1 */
const moonTour = vi.fn().mockResolvedValue({ id: 10, tenant: 1 });

describe('verifyTourTenant', () => {
  it('accepts a signup for a tour of the same tenant', async () => {
    const data = { tour: 10, tenant: 1 };
    await expect(invoke(data, moonTour)).resolves.toEqual(data);
  });

  it('rejects a signup for another tenant’s tour', async () => {
    // Tenant 2 posting to tenant 1's tour — the case ids can be guessed into
    await expect(invoke({ tour: 10, tenant: 2 }, moonTour)).rejects.toThrow(
      'Tour does not belong to the tenant'
    );
  });

  it('rejects a signup for a tour that does not exist', async () => {
    const missing = vi.fn().mockResolvedValue(null);
    await expect(invoke({ tour: 99, tenant: 1 }, missing)).rejects.toThrow(
      'Tour does not belong to the tenant'
    );
  });

  it('compares by id when the relations are populated', async () => {
    const data = { tour: { id: 10 }, tenant: { id: 1 } };
    await expect(
      invoke(data as Partial<TourSignup>, moonTour)
    ).resolves.toEqual(data);
  });

  it('leaves missing required fields to validation', async () => {
    const findByID = vi.fn();

    await expect(invoke({ tenant: 1 }, findByID)).resolves.toEqual({
      tenant: 1
    });
    await expect(invoke({ tour: 10 }, findByID)).resolves.toEqual({ tour: 10 });
    expect(findByID).not.toHaveBeenCalled();
  });

  it('only runs on create', async () => {
    const findByID = vi.fn();

    await invoke({ tour: 10, tenant: 2 }, findByID, 'update');
    expect(findByID).not.toHaveBeenCalled();
  });
});
