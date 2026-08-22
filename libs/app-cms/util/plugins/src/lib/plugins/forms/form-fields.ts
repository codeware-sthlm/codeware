import type { Field } from 'payload';

/**
 * List-only column linking a form to the submissions it has received.
 *
 * A `ui` field rather than a virtual one: the count is only ever wanted in the
 * list, and a virtual field would resolve on every form read — including the
 * site rendering a form block through a tenant api key.
 */
const submissions: Field = {
  name: 'submissions',
  type: 'ui',
  label: { en: 'Submissions', sv: 'Svar' },
  admin: {
    components: {
      Cell: '@codeware/apps/cms/components/SubmissionCountCell'
    }
  }
};

/**
 * States the tenant's generic notification recipient, or warns there is
 * none, whenever a notification email is left unaddressed.
 *
 * Sits directly above the plugin's own `emails` array — the editor is
 * already looking there when deciding whether to fill in "Email To".
 */
const notificationRecipientHint: Field = {
  name: 'notificationRecipientHint',
  type: 'ui',
  admin: {
    components: {
      Field:
        '@codeware/apps/cms/components/admin/forms/FormNotificationRecipientField'
    }
  }
};

/**
 * Extend the plugin's form fields with our own.
 */
export const formFields = ({
  defaultFields
}: {
  defaultFields: Field[];
}): Field[] => {
  const fields = [...defaultFields, submissions];

  const emailsIndex = defaultFields.findIndex(
    (field) => 'name' in field && field.name === 'emails'
  );
  if (emailsIndex >= 0) {
    fields.splice(emailsIndex, 0, notificationRecipientHint);
  }

  return fields;
};
