import {
  type CollectionSlug,
  type CollectionTenantScopedType,
  type CollectionType,
  getId
} from '@codeware/shared/util/payload';
import { ValidationError } from 'payload/errors';
import { FieldHook, RelationshipField } from 'payload/types';

import { slugName } from '../slug.field';

/**
 * Ensures that the slug is unique for the collection,
 * within the tenant when scoped or across the entire workspace.
 *
 * - If the collection is tenant scoped, it will check if the slug is unique for the tenant.
 * - If the collection is not tenant scoped, it will check if the slug is unique across the entire workspace.
 */
export const ensureUniqueSlug: FieldHook<CollectionType> = async ({
  collection,
  data,
  global,
  originalDoc,
  req: { payload },
  value
}) => {
  // Only applicable to collections
  if (!collection) {
    payload.logger.warn(
      `ensureUniqueSlug hook is not applicable to global '${global?.slug}'`
    );
    return value;
  }

  // Skip validation if the slug field does not exist
  if (
    !collection.fields.find(
      (field) => field.type === 'text' && field.name === slugName
    )
  ) {
    payload.logger.warn(
      `ensureUniqueSlug hook is not applicable to collection '${collection.slug}' because it does not have a '${slugName}' field`
    );
    return value;
  }

  // Check if the collection is scoped to tenants
  const tenantField = collection.fields
    .filter(
      (field) =>
        field.type === 'relationship' &&
        field.relationTo === ('tenants' satisfies CollectionSlug)
    )
    // TS does not infer the correct type
    .map((field) => field as RelationshipField)
    .at(0);

  if (tenantField) {
    const tenantKey = tenantField.name;
    const incomingTenantId = getId<CollectionTenantScopedType>(
      // @ts-expect-error - Type is known by design
      data[tenantKey]
    );
    const currentTenantId = getId<CollectionTenantScopedType>(
      // @ts-expect-error - Type is known by design
      originalDoc[tenantKey]
    );

    // Match the changed tenant or fallback to the current one
    const tenantId = incomingTenantId || currentTenantId;

    // Find duplicate documents for the tenant
    const matchedDocs = await payload.find({
      collection: collection.slug,
      where: {
        and: [
          { tenant: { equals: tenantId } },
          { slug: { equals: value } },
          // Exclude the current document from the search if it exists
          { id: { not_equals: originalDoc?.id ?? 0 } }
        ]
      }
    });

    // Throw if the slug is already taken by another document in the same tenant
    if (matchedDocs.docs.length > 0) {
      const tenant = await payload.findByID({
        collection: 'tenants',
        id: tenantId
      });

      throw new ValidationError([
        {
          message: `Workspace '${tenant.name}' already has an entity with the slug '${value}'. Slugs must be unique for the workspace.`,
          field: slugName
        }
      ]);
    }
  }
  // If the collection is not tenant scoped, check if the slug is unique across the entire workspace
  else {
    const matchedDocs = await payload.find({
      collection: collection.slug,
      where: {
        and: [
          { slug: { equals: value } },
          // Exclude the current document from the search if it exists
          { id: { not_equals: originalDoc?.id ?? 0 } }
        ]
      }
    });

    // Throw if the slug is already taken by another document in the workspace
    if (matchedDocs.docs.length > 0) {
      throw new ValidationError([
        {
          message: `An entity with the slug '${value}' already exists. Slug must be unique.`,
          field: slugName
        }
      ]);
    }
  }

  return value;
};
