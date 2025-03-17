import type { Env } from '@codeware/app-cms/util/env-schema';
import { nodemailerAdapter } from '@payloadcms/email-nodemailer';
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import nodemailerSendgrid from 'nodemailer-sendgrid';

/**
 * Get the email adapter or undefined if email is disabled.
 *
 * @param env - The environment variables.
 * @returns The email adapter or undefined.
 */
export const getEmailAdapter = (env: Env) => {
  // First check if sendgrid is configured
  if (env.EMAIL?.sendgrid) {
    const { apiKey, defaultFromAddress, defaultFromName } = env.EMAIL.sendgrid;

    return nodemailerAdapter({
      defaultFromAddress,
      defaultFromName,
      transportOptions: nodemailerSendgrid({
        apiKey
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

  // Email is disabled
  return undefined;
};
