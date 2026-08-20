import { getId } from '@codeware/app-cms/util/misc';
import type { Form } from '@codeware/shared/util/payload-types';
import type { Payload, TypedLocale } from 'payload';

export type FormData = Pick<Form, 'tenant'> & {
  title: string;
};

/** Minimal Lexical value wrapping a single paragraph of text */
const paragraph = (text: string) => ({
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        version: 1,
        children: [{ type: 'text', text, version: 1 }]
      }
    ],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1
  }
});

/**
 * Ensure a contact form exists for the given tenant.
 *
 * Seeded so every environment has one form that actually sends mail, which is
 * what makes a broken mail setup visible by using the site rather than by
 * reading logs.
 *
 * `emailFrom` and `emailTo` are deliberately left empty. The plugin falls back
 * to the configured default sender for both, so the form needs no per-tenant
 * address and follows whatever transport the environment resolved — Mailpit
 * locally, Mailtrap on preview, SendGrid in production.
 *
 * @param payload - Payload instance
 * @param data - Form data
 * @param options - Seed options
 * @returns The created form or the id if one already exists
 */
export async function ensureForm(
  payload: Payload,
  data: FormData,
  options: { locale: TypedLocale; transactionID: string | number | undefined }
): Promise<Form | number> {
  const { locale, transactionID } = options;
  const { title, tenant } = data;

  const forms = await payload.find({
    collection: 'forms',
    where: {
      and: [
        { title: { equals: title } },
        tenant ? { tenant: { in: [getId(tenant)] } } : {}
      ]
    },
    depth: 0,
    limit: 1,
    req: { transactionID }
  });

  if (forms.totalDocs) {
    return forms.docs[0].id;
  }

  const form = await payload.create({
    collection: 'forms',
    data: {
      title,
      tenant,
      fields: [
        {
          blockType: 'text',
          name: 'name',
          label: 'Name',
          width: 3,
          required: true
        },
        {
          blockType: 'email',
          name: 'email',
          label: 'Email',
          width: 3,
          required: true
        },
        {
          blockType: 'textarea',
          name: 'message',
          label: 'Message',
          width: 6,
          required: true
        }
      ],
      submitButtonLabel: 'Send message',
      confirmationType: 'message',
      confirmationMessage: paragraph('Thanks! We will get back to you.'),
      emails: [
        {
          subject: `New message from {{name}}`,
          // The plugin expands `{{*:table}}` into every submitted field, so
          // the notification keeps working when the form gains a field
          message: paragraph('{{*:table}}')
        }
      ]
    },
    locale,
    req: { transactionID }
  });

  return form;
}
