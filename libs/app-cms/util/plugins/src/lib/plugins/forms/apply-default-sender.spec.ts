import { describe, expect, it, vi } from 'vitest';

import { applyDefaultSender } from './apply-default-sender';

type Args = Parameters<typeof applyDefaultSender>;

const logger = { error: vi.fn() };

/** A fully configured email adapter */
const configured = {
  defaultFromAddress: 'no-reply@codeware.se',
  defaultFromName: 'Codeware'
};

const invoke = (
  emails: Array<Record<string, unknown>>,
  email: Record<string, unknown> | undefined = configured
) =>
  applyDefaultSender(
    emails as Args[0],
    {
      req: { payload: { email, logger } }
    } as unknown as Args[1]
  );

/** What the plugin builds when a form leaves `emailFrom` empty */
const noSender = {
  from: undefined,
  replyTo: undefined,
  to: 'cloud@codeware.se',
  subject: 'New message'
};

describe('applyDefaultSender', () => {
  it('fills in the configured sender when the form has none', () => {
    expect(invoke([noSender])).toEqual([
      {
        ...noSender,
        from: 'Codeware <no-reply@codeware.se>',
        replyTo: 'Codeware <no-reply@codeware.se>'
      }
    ]);
  });

  it('leaves a sender the form set alone', () => {
    const withSender = { ...noSender, from: 'sales@codeware.se' };
    expect(invoke([withSender])).toEqual([withSender]);
  });

  it('keeps a reply-to the form set', () => {
    const [result] = invoke([{ ...noSender, replyTo: 'ask@codeware.se' }]);
    expect(result).toMatchObject({
      from: 'Codeware <no-reply@codeware.se>',
      replyTo: 'ask@codeware.se'
    });
  });

  it('omits the name when only an address is configured', () => {
    const [result] = invoke([noSender], {
      defaultFromAddress: 'no-reply@codeware.se'
    });
    expect(result).toMatchObject({ from: 'no-reply@codeware.se' });
  });

  it('reports the misconfiguration when no sender is configured either', () => {
    // An empty address is what an unset SENDGRID_FROM_ADDRESS now yields —
    // sending it as `Codeware <>` would only fail further downstream
    expect(invoke([noSender], { defaultFromAddress: '' })).toEqual([noSender]);
    expect(logger.error).toHaveBeenCalled();
  });

  it('handles an email adapter not being configured at all', () => {
    const result = applyDefaultSender(
      [noSender] as Args[0],
      {
        req: { payload: { logger } }
      } as unknown as Args[1]
    );
    expect(result).toEqual([noSender]);
  });
});
