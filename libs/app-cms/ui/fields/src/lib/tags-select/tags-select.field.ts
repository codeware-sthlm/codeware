import { deepMerge } from '@codeware/shared/util/pure';
import type { RelationshipField } from 'payload';

type Options = {
  /**
   * Whether to build an index for the field.
   *
   * Set this field to true if your users will perform queries
   * on this field's data often.
   * @default false
   */
  buildIndex?: boolean;

  /**
   * Limit tags to specific tag slugs.
   */
  limitTags?: Array<string>;

  /**
   * Override properties which will be deep merged with the field.
   */
  overrides?: Partial<RelationshipField>;

  /**
   * Whether the field is required.
   * @default false
   */
  required?: boolean;
};

/**
 * Tags field that can be used to select one or many tags.
 *
 * Opinionated configuration:
 * - Field name is 'tags'
 * - Multiple tags are allowed
 * - Tags can be sorted using drag and drop
 * - Label is provided
 *
 * **Tip!**
 *
 * For advanced selection of tags, override admin appearance to 'drawer'.
 *
 * @param options - Options for the field
 */
export const tagsSelectField = ({
  buildIndex = false,
  limitTags = [],
  overrides,
  required = false
}: Options = {}): RelationshipField => {
  const field: RelationshipField = {
    name: 'tags',
    type: 'relationship',
    label: { en: 'Tags', sv: 'Etiketter' },
    relationTo: 'tags',
    admin: {
      isSortable: true
    },
    hasMany: true,
    index: buildIndex,
    required
  };

  if (limitTags.length > 0) {
    field.filterOptions = { slug: { in: limitTags } };
  }

  return overrides ? deepMerge(field, overrides) : field;
};
