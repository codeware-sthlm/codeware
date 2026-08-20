import type { Env } from '@codeware/app-cms/util/env-schema';
import { nodemailerAdapter } from '@payloadcms/email-nodemailer';
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import nodemailerSendgrid from 'nodemailer-sendgrid';
import type { EmailAdapter } from 'payload';

import { etherealFallbackAdapter } from './ethereal-fallback-adapter';
import { withDeliveryReporting } from './with-delivery-reporting';

/**
 * Get the email adapter, or undefined when email is disabled.
 *
 * Order of preference: SendGrid where it is configured (deployments), then
 * any SMTP relay — Mailpit with no credentials, the development default, or
 * an authenticated one such as Mailtrap — then Ethereal credentials if
 * someone still keeps a set. In development, nothing configured falls back
 * to an Ethereal inbox created on the first send, so mail is never silently
 * dropped while working.
 *
 * Every branch is wrapped with {@link withDeliveryReporting} in one place, so
 * a transport failure is always logged and reported rather than only ever
 * reaching whichever caller happens to be swallowing it.
 *
 * @param env - The environment variables.
 * @returns The email adapter or undefined.
 */
export const getEmailAdapter = (env: Env) => {
  const adapter: EmailAdapter | Promise<EmailAdapter> | undefined = (() => {
    // First check if sendgrid is configured
    if (env.EMAIL?.sendgrid) {
      const { apiKey, defaultFromAddress, defaultFromName } =
        env.EMAIL.sendgrid;

      return nodemailerAdapter({
        defaultFromAddress,
        defaultFromName,
        transportOptions: nodemailerSendgrid({
          apiKey
        })
      });
    }

    // Then any other SMTP relay — a local catcher with no credentials to go
    // stale (Mailpit), or a hosted sandbox / real relay with a username and
    // password (Mailtrap, say)
    if (env.EMAIL?.smtp) {
      const { defaultFromAddress, defaultFromName, host, port, user, pass } =
        env.EMAIL.smtp;
      const hasAuth = Boolean(user && pass);

      return nodemailerAdapter({
        defaultFromAddress,
        defaultFromName,
        // A credential-less catcher is only running when someone started it;
        // a send still fails loudly (and is already caught where it's sent)
        // if it's not, so nothing is gained by also failing the connection
        // check on boot. An authenticated relay is a real remote service —
        // wrong credentials are worth catching immediately instead.
        skipVerify: !hasAuth,
        transport: nodemailer.createTransport({
          host,
          port,
          ...(hasAuth
            ? // Real TLS negotiation, same as the Ethereal branch below
              { auth: { user, pass } }
            : // A catcher accepts anything; requiring TLS would only break it
              { secure: false, ignoreTLS: true })
        })
      });
    }

    // Nothing configured. In development that is usually an oversight rather
    // than a decision, and a dropped confirmation is hard to notice — so make
    // an inbox on demand instead of going quiet.
    if (env.DEPLOY_ENV === 'development' && env.NX_RUN_TARGET !== 'build') {
      return etherealFallbackAdapter();
    }

    // Email is disabled
    return undefined;
  })();

  return adapter && withDeliveryReporting(adapter);
};
