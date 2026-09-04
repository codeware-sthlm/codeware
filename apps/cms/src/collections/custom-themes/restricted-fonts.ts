import { fontById, isRestrictedFont } from '@codeware/shared/util/color';

/**
 * The recipe fields that name a typeface.
 *
 * No `fontMono`: the registry offers one mono face, so it is templated rather
 * than stored, and scanning a field the recipe does not have would refuse a
 * save over a value that never renders.
 */
const FONT_FIELDS = ['fontBody', 'fontHeading'] as const;

/**
 * The licensed typefaces a stored recipe names, by label.
 *
 * The studio hides a restricted family from a tenant admin, but hiding a
 * control is not a control: `recipe` is a JSON column, so it can be set through
 * the API or by editing the field directly. This is what the collection gates
 * on, and it is deliberately just the reporting half — who may use one, and how
 * that reads in the admin's language, both belong to the caller.
 *
 * An unknown id is left out: it resolves to the slot's default elsewhere, and
 * refusing a save over it would report a problem the author cannot act on.
 *
 * @param value - The stored recipe, straight from the JSON column
 * @returns Labels of the restricted families named, empty when there are none
 */
export const restrictedFontsIn = (value: unknown): Array<string> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  const recipe = value as Record<string, unknown>;

  const refused = FONT_FIELDS.map((field) => recipe[field])
    .filter((id): id is string => typeof id === 'string')
    .filter((id) => isRestrictedFont(id));

  return [...new Set(refused)].map((id) => fontById(id)?.label ?? id);
};
