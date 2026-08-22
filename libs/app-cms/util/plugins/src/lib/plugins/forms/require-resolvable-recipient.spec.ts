import type { Form } from '@codeware/shared/util/payload-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requireResolvableRecipient } from './require-resolvable-recipient';

type HookArgs = Parameters<typeof requireResolvableRecipient>[0];

const find = vi.fn();

const req = () =>
  ({
    payload: { find },
    // The translated message is asserted through its key, not its wording
    t: (key: string) => key
  }) as unknown as HookArgs['req'];

const invoke = (
  data: Partial<Form> | null,
  {
    operation = 'create' as 'create' | 'update',
    originalDoc
  }: { operation?: 'create' | 'update'; originalDoc?: Partial<Form> } = {}
) =>
  requireResolvableRecipient({
    data,
    operation,
    originalDoc,
    req: req()
  } as unknown as HookArgs);

const email = (emailTo?: string) => ({
  emailTo,
  subject: 'New message'
});

describe('requireResolvableRecipient', () => {
  beforeEach(() => {
    find.mockReset();
  });

  it('allows a form whose every notification email has its own recipient', async () => {
    const data = { tenant: 1, emails: [email('sales@codeware.se')] };

    await expect(invoke(data)).resolves.toEqual(data);
    expect(find).not.toHaveBeenCalled();
  });

  it('allows a form with no notification emails at all', async () => {
    const data = { tenant: 1, emails: [] };

    await expect(invoke(data)).resolves.toEqual(data);
    expect(find).not.toHaveBeenCalled();
  });

  it('allows an unaddressed email when the tenant has a generic recipient', async () => {
    find.mockResolvedValue({
      docs: [{ forms: { notificationRecipients: [{ email: 'a@b.com' }] } }]
    });
    const data = { tenant: 1, emails: [email(undefined)] };

    await expect(invoke(data)).resolves.toEqual(data);
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'site-settings',
        where: { tenant: { equals: 1 } }
      })
    );
  });

  it('refuses an unaddressed email when the tenant has no generic recipient', async () => {
    find.mockResolvedValue({ docs: [{}] });
    const data = { tenant: 1, emails: [email(undefined)] };

    await expect(invoke(data)).rejects.toThrow('validation:formNeedsRecipient');
  });

  it('refuses when the tenant has no site settings at all', async () => {
    find.mockResolvedValue({ docs: [] });
    const data = { tenant: 1, emails: [email(undefined)] };

    await expect(invoke(data)).rejects.toThrow('validation:formNeedsRecipient');
  });

  it('refuses when only one of several emails is left unaddressed', async () => {
    find.mockResolvedValue({ docs: [{}] });
    const data = {
      tenant: 1,
      emails: [email('sales@codeware.se'), email(undefined)]
    };

    await expect(invoke(data)).rejects.toThrow('validation:formNeedsRecipient');
  });

  it('falls back to the original document on an update that leaves emails untouched', async () => {
    find.mockResolvedValue({ docs: [{}] });

    await expect(
      invoke(
        { title: 'Renamed' },
        {
          operation: 'update',
          originalDoc: { tenant: 1, emails: [email(undefined)] }
        }
      )
    ).rejects.toThrow('validation:formNeedsRecipient');
  });

  it('leaves a missing tenant to its own required validation', async () => {
    const data = { emails: [email(undefined)] };

    await expect(invoke(data)).resolves.toEqual(data);
    expect(find).not.toHaveBeenCalled();
  });

  it('does nothing on delete', async () => {
    const data = { tenant: 1, emails: [email(undefined)] };

    await expect(
      invoke(data, { operation: 'delete' as 'create' })
    ).resolves.toEqual(data);
    expect(find).not.toHaveBeenCalled();
  });
});
