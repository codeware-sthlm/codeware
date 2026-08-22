/**
 * The submission id a `beforeEmail` hook runs with.
 *
 * The plugin's own type for this hook understates its runtime shape:
 * `beforeEmail` is wired as the FormSubmissions `afterChange` hook and always
 * passes a `doc`, even though the declared param type is its `beforeChange`
 * (data-only) shape — see `sendEmail.js` in `@payloadcms/plugin-form-builder`.
 *
 * Shared by every `beforeEmail` hook that needs to correlate back to the
 * submission being created.
 */
export const getSubmissionId = (params: unknown): number | undefined => {
  const id = (params as { doc?: { id?: unknown } })?.doc?.id;
  return typeof id === 'number' ? id : undefined;
};
