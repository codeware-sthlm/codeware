import { beforeEach, describe, expect, it, vi } from 'vitest';

import { applyDefaultRecipient } from './apply-default-recipient';
import { takeOutcome } from './delivery-outcomes';

type Args = Parameters<typeof applyDefaultRecipient>;

const findByID = vi.fn();
const find = vi.fn();
const logger = { error: vi.fn() };
const req = { payload: { findByID, find, logger } };

/** What the plugin builds when a form leaves `emailTo` empty */
const email = {
  from: 'Codeware <no-reply@codeware.se>',
  html: '<div>hi</div>',
  replyTo: 'Codeware <no-reply@codeware.se>',
  subject: 'New message',
  to: 'no-reply@codeware.se'
};

const invoke = (
  emails: Array<Record<string, unknown>>,
  { formId = 1, submissionId = 42 } = {}
) =>
  applyDefaultRecipient(
    emails as Args[0],
    {
      data: { form: formId },
      doc: { id: submissionId },
      req
    } as unknown as Args[1]
  );

describe('applyDefaultRecipient', () => {
  beforeEach(() => {
    findByID.mockReset();
    find.mockReset();
    logger.error.mockClear();
  });

  it("keeps the plugin's resolved recipient when the form set its own emailTo", async () => {
    findByID.mockResolvedValue({
      id: 1,
      tenant: 5,
      emails: [{ emailTo: 'sales@codeware.se' }]
    });
    const configuredEmail = { ...email, to: 'sales@codeware.se' };

    const result = await invoke([configuredEmail]);

    expect(result).toEqual([configuredEmail]);
    // No form entry is missing an emailTo — no need to look up tenant settings
    expect(find).not.toHaveBeenCalled();
  });

  it("redirects to the tenant's generic recipients when the form left emailTo empty", async () => {
    findByID.mockResolvedValue({
      id: 1,
      tenant: 5,
      emails: [{ emailTo: undefined }]
    });
    find.mockResolvedValue({
      docs: [
        {
          forms: {
            notificationRecipients: [
              { email: 'admin@codeware.se' },
              { email: 'ops@codeware.se' }
            ]
          }
        }
      ]
    });

    const result = await invoke([email]);

    expect(result).toEqual([
      { ...email, to: 'admin@codeware.se, ops@codeware.se' }
    ]);
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'site-settings',
        where: { tenant: { equals: 5 } }
      })
    );
  });

  it('drops the message and records "no-recipient" when nothing resolves', async () => {
    findByID.mockResolvedValue({
      id: 1,
      tenant: 5,
      emails: [{ emailTo: undefined }]
    });
    find.mockResolvedValue({ docs: [] });

    const result = await invoke([email], { submissionId: 99 });

    expect(result).toEqual([]);
    expect(takeOutcome(99)).toBe('no-recipient');
    expect(logger.error).toHaveBeenCalled();
  });

  it('treats a whitespace-only emailTo the same as none at all', async () => {
    findByID.mockResolvedValue({
      id: 1,
      tenant: 5,
      emails: [{ emailTo: '   ' }]
    });
    find.mockResolvedValue({
      docs: [
        { forms: { notificationRecipients: [{ email: 'admin@codeware.se' }] } }
      ]
    });

    const result = await invoke([email]);

    expect(result).toEqual([{ ...email, to: 'admin@codeware.se' }]);
  });

  it('drops the message when the tenant has no site settings at all', async () => {
    findByID.mockResolvedValue({
      id: 1,
      tenant: 5,
      emails: [{ emailTo: undefined }]
    });
    find.mockResolvedValue({ docs: [{}] });

    const result = await invoke([email], { submissionId: 98 });

    expect(result).toEqual([]);
    expect(takeOutcome(98)).toBe('no-recipient');
  });

  it('leaves emails untouched when the form cannot be found', async () => {
    findByID.mockResolvedValue(null);

    const result = await invoke([email]);

    expect(result).toEqual([email]);
    expect(find).not.toHaveBeenCalled();
  });

  it('leaves emails untouched when the submission carries no form id', async () => {
    const result = await invoke([email], { formId: 0 });

    expect(result).toEqual([email]);
    expect(findByID).not.toHaveBeenCalled();
  });

  it('maps each email to its stored form entry by index', async () => {
    findByID.mockResolvedValue({
      id: 1,
      tenant: 5,
      emails: [{ emailTo: 'first@codeware.se' }, { emailTo: undefined }]
    });
    find.mockResolvedValue({
      docs: [
        { forms: { notificationRecipients: [{ email: 'admin@codeware.se' }] } }
      ]
    });

    const first = { ...email, to: 'first@codeware.se' };
    const second = { ...email, to: 'no-reply@codeware.se' };

    const result = await invoke([first, second]);

    expect(result).toEqual([first, { ...second, to: 'admin@codeware.se' }]);
  });
});
