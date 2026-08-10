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
 * Extend the plugin's form fields with our own.
 */
export const formFields = ({
  defaultFields
}: {
  defaultFields: Field[];
}): Field[] => [...defaultFields, submissions];
