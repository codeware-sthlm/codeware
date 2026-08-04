import { customT } from '@codeware/app-cms/util/i18n';
import { deepMerge } from '@codeware/shared/util/pure';
import type { RelationshipField } from 'payload';

import type { PlatformLabelType } from './platform-labels.collection';

type Options = {
  /** Which vocabulary this field draws from */
  labelType: PlatformLabelType;
  /** Field name on the consuming collection */
  name: string;
  /** Override properties merged into the field */
  overrides?: Partial<RelationshipField>;
  /** @default false */
  required?: boolean;
};

/**
 * A relationship to a platform label of one type.
 *
 * `filterOptions` scopes the picker, but the REST API and seed scripts bypass
 * it — so the type is verified again on validate, keeping a stock subject from
 * being saved as a kind of place.
 */
export const platformLabelField = ({
  labelType,
  name,
  overrides,
  required = false
}: Options): RelationshipField => {
  const field: RelationshipField = {
    name,
    type: 'relationship',
    relationTo: 'platform-labels',
    required,
    index: true,
    filterOptions: { type: { equals: labelType } },
    validate: async (value, { req }) => {
      if (!value) {
        return required ? req.t('validation:required') : true;
      }

      // A single relationship value is the id, or the populated document
      const id =
        typeof value === 'object' && value !== null && 'id' in value
          ? (value as { id: number | string }).id
          : (value as number | string);

      const label = await req.payload.findByID({
        collection: 'platform-labels',
        id,
        depth: 0,
        disableErrors: true,
        req
      });

      if (!label) {
        return customT(req.t)('validation:labelNotFound');
      }

      return label.type === labelType
        ? true
        : customT(req.t)('validation:labelWrongType', {
            actual: label.type,
            expected: labelType
          });
    }
  };

  return overrides ? deepMerge(field, overrides) : field;
};
