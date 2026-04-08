import type { TenantRole } from '@codeware/shared/util/payload-types';
import type { TenantLookup, UserLookup } from '@codeware/shared/util/seed';
import type { Payload } from 'payload';

import type { TenantDataLookup } from '../seed-types';

type MapKey = { apiKey: string; slug: string };
type TenantDataWithID = TenantDataLookup & { id: number };
type TenantDataWithIDRole = TenantDataWithID & { role: TenantRole };

const mapper = {
  // Map to category id (unique per tenant)
  category: new Map<string, number>(),

  // Map to media id (unique per tenant)
  media: new Map<string, number>(),

  // Map to page id (unique per tenant)
  page: new Map<string, number>(),

  // Map to tag id (unique per tenant)
  tag: new Map<string, number>(),

  // Map api key to tenant id and seed data (unique across tenants)
  tenant: new Map<string, TenantDataWithID>(),

  // Map email to user id (unique across tenants)
  user: new Map<string, number>()
};

/**
 * Temporary store.
 *
 * This is used to store and lookup ids.
 */
export const tempStore = {
  /**
   * Store category to map.
   *
   * @param category - The category to store.
   * @param categoryId - The id of the category.
   */
  category: (category: MapKey, categoryId: number) => {
    mapper.category.set(JSON.stringify(category), categoryId);
  },

  /**
   * Store media to map.
   *
   * @param media - The media to store.
   * @param mediaId - The id of the media.
   */
  media: (media: MapKey, mediaId: number) => {
    mapper.media.set(JSON.stringify(media), mediaId);
  },

  /**
   * Store page to map.
   *
   * @param page - The page to store.
   * @param pageId - The id of the page.
   */
  page: (page: MapKey, pageId: number) => {
    mapper.page.set(JSON.stringify(page), pageId);
  },

  /**
   * Store tag to map.
   *
   * @param tag - The tag to store.
   * @param tagId - The id of the tag.
   */
  tag: (tag: MapKey, tagId: number) => {
    mapper.tag.set(JSON.stringify(tag), tagId);
  },

  /**
   * Store tenant api key and tenant data in map.
   *
   * @param apiKey - The api key of the tenant.
   * @param tenant - The tenant data including id.
   */
  tenant: (apiKey: string, tenant: TenantDataWithID) => {
    mapper.tenant.set(apiKey, tenant);
  },

  /**
   * Store user email and user id in map.
   *
   * @param email - The email of the user.
   * @param userId - The id of the user.
   */
  user: (email: string, userId: number) => {
    mapper.user.set(email, userId);
  }
};

/**
 * Lookup category id's.
 *
 * @param payload - The payload instance.
 * @param categories - The categories to lookup.
 */
export function lookupCategory(
  payload: Payload,
  categories: Array<MapKey>
): Array<number> {
  return categories.reduce((acc, category) => {
    const categoryId = mapper.category.get(JSON.stringify(category));
    if (!categoryId) {
      payload.logger.error(
        `Skip: Category '${category.slug}' for tenant '${category.apiKey}' not found`
      );
      return acc;
    }
    acc.push(categoryId);
    return acc;
  }, [] as Array<number>);
}

/**
 * Lookup media id's.
 *
 * @param payload - The payload instance.
 * @param media - The media to lookup.
 */
export function lookupMedia(
  payload: Payload,
  media: Array<MapKey>
): Array<number> {
  return media.reduce((acc, media) => {
    const mediaId = mapper.category.get(JSON.stringify(media));
    if (!mediaId) {
      payload.logger.error(
        `Skip: Media '${media.slug}' for tenant '${media.apiKey}' not found`
      );
      return acc;
    }
    acc.push(mediaId);
    return acc;
  }, [] as Array<number>);
}

/**
 * Lookup page id's.
 *
 * @param payload - The payload instance.
 * @param pages - The pages to lookup.
 */
export function lookupPage(
  payload: Payload,
  pages: Array<MapKey>
): Array<number> {
  return pages.reduce((acc, page) => {
    const pageId = mapper.page.get(JSON.stringify(page));
    if (!pageId) {
      payload.logger.error(
        `Skip: Page '${page.slug}' for tenant '${page.apiKey}' not found`
      );
      return acc;
    }
    acc.push(pageId);
    return acc;
  }, [] as Array<number>);
}

/**
 * Lookup tag id's.
 *
 * @param payload - The payload instance.
 * @param tags - The tags to lookup.
 */
export function lookupTag(
  payload: Payload,
  tags: Array<MapKey>
): Array<number> {
  return tags.reduce((acc, tag) => {
    const tagId = mapper.tag.get(JSON.stringify(tag));
    if (!tagId) {
      payload.logger.error(
        `Skip: Tag '${tag.slug}' for tenant '${tag.apiKey}' not found`
      );
      return acc;
    }
    acc.push(tagId);
    return acc;
  }, [] as Array<number>);
}

/**
 * Lookup user id by email.
 *
 * @param payload - The payload instance.
 * @param users - The users to lookup.
 */
export function lookupUser(
  payload: Payload,
  users: Array<UserLookup>
): Array<number> {
  return users.reduce((acc, user) => {
    const userId = mapper.user.get(user.lookupEmail);
    if (!userId) {
      payload.logger.error(`Skip: User '${user.lookupEmail}' not found`);
      return acc;
    }
    acc.push(userId);
    return acc;
  }, [] as Array<number>);
}

/**
 * Lookup tenant and role by api key.
 *
 * @param payload - The payload instance.
 * @param tenants - The tenant api keys to lookup.
 * @returns Tenant entities with tenant id and role.
 */
export function lookupTenant(
  payload: Payload,
  tenants: Array<TenantLookup>
): Array<TenantDataWithIDRole>;
export function lookupTenant(
  payload: Payload,
  tenants: Array<Pick<TenantLookup, 'lookupApiKey'>>
): Array<TenantDataWithID>;
export function lookupTenant(
  payload: Payload,
  tenants: Array<TenantLookup | Pick<TenantLookup, 'lookupApiKey'>>
) {
  return tenants.reduce(
    (acc, tenantLookup) => {
      const tenant = mapper.tenant.get(tenantLookup.lookupApiKey);
      if (!tenant) {
        payload.logger.error(
          `Skip: Tenant '${tenantLookup.lookupApiKey}' not found`
        );
        return acc;
      }
      // If the tenant lookup includes a role, use it
      if ('role' in tenantLookup && tenantLookup.role) {
        acc.push({ ...tenant, role: tenantLookup.role });
      } else {
        acc.push(tenant);
      }
      return acc;
    },
    [] as Array<TenantDataWithID | TenantDataWithIDRole>
  );
}
