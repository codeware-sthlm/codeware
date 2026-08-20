import type { BeforeEmail } from '@payloadcms/plugin-form-builder/types';

/**
 * Fill in the sender the form itself leaves empty.
 *
 * `emailFrom` is optional, and the plugin still puts the key on the message as
 * `undefined`. The nodemailer adapter merges as `{ from: default, ...message }`,
 * so that `undefined` wins over `defaultFromAddress` and the mail goes out with
 * no sender at all — which SendGrid rejects.
 *
 * The sender also has to be an address the deployment has authenticated with
 * its mail provider, so the configured default is the right fallback.
 */
export const applyDefaultSender: BeforeEmail = (
  emails,
  { req: { payload } }
) => {
  const { defaultFromAddress, defaultFromName } = payload.email ?? {};

  return emails.map((email) => {
    if (email.from) {
      return email;
    }

    if (!defaultFromAddress) {
      payload.logger.error(
        'No sender configured for form email — set the form\'s "Email From" or a default from address'
      );
      return email;
    }

    const from = defaultFromName
      ? `${defaultFromName} <${defaultFromAddress}>`
      : defaultFromAddress;

    // `replyTo` mirrors the plugin, which defaults it to the sender
    return { ...email, from, replyTo: email.replyTo || from };
  });
};
