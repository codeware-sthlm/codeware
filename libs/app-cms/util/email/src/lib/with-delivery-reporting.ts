import * as Sentry from '@sentry/nextjs';
import type { EmailAdapter } from 'payload';

/**
 * Make a transport failure loud instead of a line only `fly logs` sees.
 *
 * Every current caller of `payload.sendEmail` swallows its own rejection —
 * deliberately, since a form submission or a tour signup that reached the
 * database must not be undone by a mail provider being down. That leaves the
 * rejection with nowhere to surface: nothing downstream ever sees it (COD-288).
 *
 * Wrapping the adapter is the one place that can report every send without
 * touching each caller. It still rethrows, so a caller that does propagate
 * failures (Payload's own forgot-password flow, say) keeps deciding what
 * happens next — that path also reaches the config's `afterError` hook, so a
 * failure there is reported twice; accepted, since preventing it would mean
 * either silently swallowing here (masking exactly what this fixes) or
 * threading transport awareness into every caller instead of one adapter.
 */
export const withDeliveryReporting = (
  adapter: EmailAdapter | Promise<EmailAdapter>
): EmailAdapter | Promise<EmailAdapter> => {
  const wrap: (factory: EmailAdapter) => EmailAdapter = (factory) => (args) => {
    const inner = factory(args);

    return {
      ...inner,
      sendEmail: async (message) => {
        try {
          return await inner.sendEmail(message);
        } catch (err) {
          args.payload.logger.error({
            err,
            msg: `[email] "${inner.name}" failed to send "${message.subject}" to ${String(message.to)}`
          });
          Sentry.captureException(err, {
            tags: { emailTransport: inner.name },
            extra: { to: message.to, subject: message.subject }
          });
          throw err;
        }
      }
    };
  };

  return adapter instanceof Promise ? adapter.then(wrap) : wrap(adapter);
};
