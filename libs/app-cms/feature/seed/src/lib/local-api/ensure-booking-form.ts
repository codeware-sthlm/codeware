import type { Form } from '@codeware/shared/util/payload-types';
import type { Payload, TypedLocale } from 'payload';

import { convertMarkdownToLexical } from '../utils/convert-markdown-to-lexical';

export type BookingFormData = {
  title: string;
  tenant: number;
  /**
   * Booking commits the customer; interest is non-binding. The wording on the
   * submit button and confirmation has to match, or a tour gathering interest
   * asks visitors to "send a booking request".
   */
  intent: 'booking' | 'interest';
};

/**
 * Ensure that a booking form exist for the tenant.
 *
 * Tours book through a form rather than an email address, so the seed needs a
 * form to point them at. Kept minimal on purpose — enough fields to show the
 * booking flow, not a real booking system.
 *
 * @param payload - Payload instance
 * @param data - Booking form data
 * @param options - Seed options
 * @returns The created form or the id if a form with the title exists
 */
export async function ensureBookingForm(
  payload: Payload,
  data: BookingFormData,
  options: { locale: TypedLocale; transactionID: string | number | undefined }
): Promise<Form | number> {
  const { locale, transactionID } = options;
  const { intent, title, tenant } = data;
  const isBooking = intent === 'booking';

  const forms = await payload.find({
    collection: 'forms',
    where: {
      and: [{ title: { equals: title } }, { tenant: { in: [tenant] } }]
    },
    depth: 0,
    limit: 1,
    req: { transactionID }
  });

  if (forms.totalDocs) {
    return forms.docs[0].id;
  }

  const isSwedish = locale === 'sv';

  const form = await payload.create({
    collection: 'forms',
    data: {
      title,
      tenant,
      fields: [
        {
          blockType: 'text',
          name: 'name',
          label: isSwedish ? 'Namn' : 'Name',
          required: true,
          width: 3
        },
        {
          blockType: 'email',
          name: 'email',
          label: isSwedish ? 'E-post' : 'Email',
          required: true,
          width: 3
        },
        {
          blockType: 'number',
          name: 'travellers',
          label: isSwedish ? 'Antal resenärer' : 'Number of travellers',
          required: true,
          min: 1,
          max: 20,
          width: 3
        },
        {
          blockType: 'textarea',
          name: 'message',
          label: isSwedish ? 'Något vi bör veta?' : 'Anything we should know?',
          width: 6
        }
      ],
      submitButtonLabel: isBooking
        ? isSwedish
          ? 'Skicka bokning'
          : 'Send booking request'
        : isSwedish
          ? 'Skicka intresseanmälan'
          : 'Register my interest',
      confirmationType: 'message',
      confirmationMessage: await convertMarkdownToLexical(
        payload.config,
        isBooking
          ? isSwedish
            ? 'Tack! Vi hör av oss inom två arbetsdagar för att bekräfta din plats.'
            : 'Thank you! We will get back to you within two working days to confirm your place.'
          : isSwedish
            ? 'Tack för din intresseanmälan! Vi hör av oss så snart avresan är bekräftad.'
            : 'Thank you for your interest! We will be in touch as soon as the departure is confirmed.'
      )
    },
    context: { seedAction: true },
    locale,
    req: { transactionID }
  });

  return form;
}
