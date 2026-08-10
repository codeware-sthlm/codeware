import type { Form, FormSubmission } from '@codeware/shared/util/payload-types';

/** A submission value paired with the label its form gives the field. */
export type ResolvedSubmissionField = {
  /** Stored field name, e.g. `travellers` */
  name: string;
  /** Form field label when still defined, otherwise the stored name */
  label: string;
  /** Display value — select values are resolved to their option label */
  value: string;
  /** The field is no longer part of the form it was submitted through */
  orphaned: boolean;
};

type FormField = NonNullable<Form['fields']>[number];

/**
 * Swap a stored value for the label its option carries.
 *
 * Keyed on the presence of `options` rather than a list of block types, so
 * `select`, `radio` and anything later built the same way are all covered.
 */
function toOptionLabel(
  field: Extract<FormField, { name: string }>,
  value: string
): string {
  if (!('options' in field) || !field.options) {
    return value;
  }
  return field.options.find((option) => option.value === value)?.label ?? value;
}

/** Blocks that collect a value; `message` is presentational and has no name. */
const isNamedField = (
  field: FormField
): field is Extract<FormField, { name: string }> => 'name' in field;

/**
 * Pair a submission's stored values with their parent form's field definitions.
 *
 * Submissions store field *names* only, so reading one raw shows `travellers`
 * rather than "Number of travellers" in whatever order the values happened to
 * be posted. Ordering and labels come from the form; values whose field has
 * since been renamed or removed keep their stored name and are flagged
 * `orphaned` so a reader can tell why the label looks raw.
 *
 * @param form - Parent form, or null when it could not be resolved
 * @param submissionData - The submission's stored `{ field, value }` pairs
 * @returns Form-ordered fields first, then orphaned values
 */
export function resolveSubmissionFields(
  form: Form | null | undefined,
  submissionData: FormSubmission['submissionData']
): Array<ResolvedSubmissionField> {
  const values = new Map(
    (submissionData ?? []).map((entry) => [entry.field, entry.value])
  );

  const resolved: Array<ResolvedSubmissionField> = [];

  for (const field of form?.fields ?? []) {
    if (!isNamedField(field) || !values.has(field.name)) {
      continue;
    }

    const value = values.get(field.name) ?? '';
    values.delete(field.name);

    resolved.push({
      name: field.name,
      label: field.label || field.name,
      value: toOptionLabel(field, value),
      orphaned: false
    });
  }

  // Whatever is left was submitted against a field the form no longer defines
  for (const [name, value] of values) {
    resolved.push({ name, label: name, value, orphaned: true });
  }

  return resolved;
}
