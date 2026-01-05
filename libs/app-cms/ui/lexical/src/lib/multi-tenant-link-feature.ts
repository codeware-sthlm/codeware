import { filterByTenantScope } from '@codeware/app-cms/util/filters';
import { LinkFeature } from '@payloadcms/richtext-lexical';
import type { CollectionSlug, FilterOptionsProps } from 'payload';

/**
 * Rich text editor link feature for managing links across different collections.
 *
 * Extends the default `LinkFeature` to filter documents by the tenant scope.
 *
 * **Usage limitation**
 *
 * This feature must be added on field level where `editor` is used.
 * It will not work when it's added as a default feature in Payload configuration.
 *
 * @param collections - Enable links for collections (default: `['pages', 'posts']`).
 * @returns - Rich text link feature with multi-tenant support.
 */
export const multiTenantLinkFeature = (
  collections: Array<CollectionSlug> = ['pages', 'posts']
): ReturnType<typeof LinkFeature> => {
  return LinkFeature({
    enabledCollections: collections,
    fields: ({ defaultFields }) =>
      defaultFields.reduce(
        (acc, field) => {
          // Add tenant scope filter to relationship field
          if (field.type === 'relationship') {
            field = {
              ...field,
              filterOptions: ({ req, relationTo }: FilterOptionsProps) =>
                filterByTenantScope(req, relationTo)
            };
          }
          acc.push(field);
          return acc;
        },
        [] as typeof defaultFields
      )
  });
};
