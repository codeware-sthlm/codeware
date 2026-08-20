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
 * Order of preference: SendGrid where it is configured (deployments), then a
 * plain SMTP host — a local catcher such as Mailpit, which is the development
 * default — then Ethereal credentials if someone still keeps a set. In
 * development, nothing configured falls back to an Ethereal inbox created on
 * the first send, so mail is never silently dropped while working.
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

    // Then a plain SMTP host: a local catcher has no credentials to go stale,
    // which is what makes it the one worth reaching for daily
    if (env.EMAIL?.smtp) {
      const { defaultFromAddress, defaultFromName, host, port } =
        env.EMAIL.smtp;

      return nodemailerAdapter({
        defaultFromAddress,
        defaultFromName,
        // A catcher is only running when someone started it; a send still
        // fails loudly (and is already caught where it's sent) if it's not,
        // so nothing is gained by also failing the connection check on boot
        skipVerify: true,
        transport: nodemailer.createTransport({
          host,
          port,
          // A catcher accepts anything; requiring TLS would only break it
          secure: false,
          ignoreTLS: true
        })
      });
    }

    // Then check if ethereal is configured
    if (env.EMAIL?.ethereal) {
      const { defaultFromAddress, defaultFromName, host, port, user, pass } =
        env.EMAIL.ethereal;

      const smptConfig: SMTPTransport.Options = {
        host,
        port,
        auth: { user, pass }
      };

      return nodemailerAdapter({
        defaultFromAddress,
        defaultFromName,
        transport: nodemailer.createTransport(smptConfig)
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
