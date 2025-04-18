import type { CollectionType } from '@codeware/shared/util/payload-types';

/**
 * Get the id from an entity that can be a number
 * or an object with an id property.
 *
 * For example the user tenants relation.
 *
 * @param entity - The entity to get the id from.
 * @returns The id of the entity or 0 if the entity is undefined.
 */
export const getId = <T extends CollectionType>(
  entity: T | T['id'] | undefined
): T['id'] =>
  entity && typeof entity === 'object' ? entity.id : (entity ?? 0);
