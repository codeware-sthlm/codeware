import { customT } from '@codeware/app-cms/util/i18n';
import type { PlatformLabel } from '@codeware/shared/util/payload-types';
import type { CollectionBeforeValidateHook } from 'payload';
import { ValidationError } from 'payload';

/**
 * Ensure a label name is unique within its type.
 *
 * Payload's `unique` is global, but the same word can legitimately serve two
 * vocabularies — "other" works as both a kind of place and an image subject —
 * so uniqueness has to be scoped to the type.
 */
export const ensureUniqueLabel: CollectionBeforeValidateHook<
  PlatformLabel
> = async ({ data, originalDoc, req: { payload, t } }) => {
  const name = data?.name ?? originalDoc?.name;
  const type = data?.type ?? originalDoc?.type;

  if (!name || !type) {
    return data;
  }

  const matched = await payload.find({
    collection: 'platform-labels',
    where: {
      and: [
        { type: { equals: type } },
        { name: { equals: name } },
        // Exclude the document being edited
        { id: { not_equals: originalDoc?.id ?? 0 } }
      ]
    },
    depth: 0,
    limit: 1
  });

  if (matched.totalDocs) {
    throw new ValidationError({
      collection: 'platform-labels',
      errors: [
        {
          message: customT(t)('validation:labelNameTaken', { name, type }),
          path: 'name'
        }
      ]
    });
  }

  return data;
};
