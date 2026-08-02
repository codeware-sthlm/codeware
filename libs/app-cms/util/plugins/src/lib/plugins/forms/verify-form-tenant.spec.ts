import type { FormSubmission } from '@codeware/shared/util/payload-types';
import { describe, expect, it, vi } from 'vitest';

import { verifyFormTenant } from './verify-form-tenant';

type HookArgs = Parameters<typeof verifyFormTenant>[0];

const invoke = (
  data: Partial<FormSubmission> | null,
  findByID: ReturnType<typeof vi.fn>,
  operation: 'create' | 'update' = 'create'
) =>
  verifyFormTenant({
    data,
    operation,
    req: { payload: { findByID } }
  } as unknown as HookArgs);

/** Form owned by tenant 1 */
const moonForm = vi.fn().mockResolvedValue({ id: 10, tenant: 1 });

describe('verifyFormTenant', () => {
  it('accepts a submission for a form of the same tenant', async () => {
    const data = { form: 10, tenant: 1 };
    await expect(invoke(data, moonForm)).resolves.toEqual(data);
  });

  it('rejects a submission for another tenant’s form', async () => {
    // Tenant 2 posting to tenant 1's form — the case ids can be guessed into
    await expect(invoke({ form: 10, tenant: 2 }, moonForm)).rejects.toThrow(
      'Form does not belong to the tenant'
    );
  });

  it('rejects a submission for a form that does not exist', async () => {
    const missing = vi.fn().mockResolvedValue(null);
    await expect(invoke({ form: 99, tenant: 1 }, missing)).rejects.toThrow(
      'Form does not belong to the tenant'
    );
  });

  it('compares by id when the relations are populated', async () => {
    const data = { form: { id: 10 }, tenant: { id: 1 } };
    await expect(
      invoke(data as Partial<FormSubmission>, moonForm)
    ).resolves.toEqual(data);
  });

  it('leaves missing required fields to validation', async () => {
    const findByID = vi.fn();

    await expect(invoke({ tenant: 1 }, findByID)).resolves.toEqual({
      tenant: 1
    });
    await expect(invoke({ form: 10 }, findByID)).resolves.toEqual({ form: 10 });
    expect(findByID).not.toHaveBeenCalled();
  });

  it('only runs on create', async () => {
    const findByID = vi.fn();

    await invoke({ form: 10, tenant: 2 }, findByID, 'update');
    expect(findByID).not.toHaveBeenCalled();
  });
});
