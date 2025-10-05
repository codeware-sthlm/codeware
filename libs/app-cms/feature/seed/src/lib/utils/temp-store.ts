import type { TenantRole } from '@codeware/shared/util/payload-types';
import type { TenantLookup, UserLookup } from '@codeware/shared/util/seed';
import type { Payload } from 'payload';

type MapKey = { apiKey: string; slug: string };
type TenantId = { tenant: number };
type TenantIdRole = { tenant: number; role: TenantRole };
type TenantLookupApiKey = Pick<TenantLookup, 'lookupApiKey'>;

const mapper = {
  // Map to category id (unique per tenant)
  category: new Map<string, number>(),

  // Map to media id (unique per tenant)
  media: new Map<string, number>(),

  // Map to page id (unique per tenant)
  page: new Map<string, number>(),

  // Map to tag id (unique per tenant)
  tag: new Map<string, number>(),

  // Map api key to tenant id (unique across tenants)
  tenant: new Map<string, number>(),

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
  storeCategory: (category: MapKey, categoryId: number) => {
    mapper.category.set(JSON.stringify(category), categoryId);
  },
  /**
   * Lookup category id's.
   *
   * @param payload - The payload instance.
   * @param categories - The categories to lookup.
   */
  lookupCategory: (payload: Payload, categories: Array<MapKey>) => {
    return lookupCategory(payload, categories);
  },

  /**
   * Store media to map.
   *
   * @param media - The media to store.
   * @param mediaId - The id of the media.
   */
  storeMedia: (media: MapKey, mediaId: number) => {
    mapper.media.set(JSON.stringify(media), mediaId);
  },
  /**
   * Lookup media id's.
   *
   * @param payload - The payload instance.
   * @param media - The media to lookup.
   */
  lookupMedia: (payload: Payload, media: Array<MapKey>) => {
    return lookupMedia(payload, media);
  },

  /**
   * Store page to map.
   *
   * @param page - The page to store.
   * @param pageId - The id of the page.
   */
  storePage: (page: MapKey, pageId: number) => {
    mapper.page.set(JSON.stringify(page), pageId);
  },
  /**
   * Lookup page id's.
   *
   * @param payload - The payload instance.
   * @param pages - The pages to lookup.
   */
  lookupPage: (payload: Payload, pages: Array<MapKey>) => {
    return lookupPage(payload, pages);
  },

  /**
   * Store tag to map.
   *
   * @param tag - The tag to store.
   * @param tagId - The id of the tag.
   */
  storeTag: (tag: MapKey, tagId: number) => {
    mapper.tag.set(JSON.stringify(tag), tagId);
  },
  /**
   * Lookup tag id's.
   *
   * @param payload - The payload instance.
   * @param tags - The tags to lookup.
   */
  lookupTag: (payload: Payload, tags: Array<MapKey>) => {
    return lookupTag(payload, tags);
  },

  /**
   * Store tenant api key and tenant id in map.
   *
   * @param apiKey - The api key of the tenant.
   * @param tenantId - The id of the tenant.
   */
  storeTenant: (apiKey: string, tenantId: number) => {
    mapper.tenant.set(apiKey, tenantId);
  },
  /**
   * Lookup tenant id by api key.
   *
   * @param payload - The payload instance.
   * @param tenants - The tenant api keys to lookup.
   * @returns Tenant entities with tenant id.
   */
  lookupTenant: (payload: Payload, tenants: Array<TenantLookupApiKey>) => {
    return lookupTenant(payload, tenants);
  },
  /**
   * Lookup tenant id and role by api key.
   *
   * @param payload - The payload instance.
   * @param tenants - The tenant api keys to lookup.
   * @returns Tenant entities with tenant id and role.
   */
  lookupTenantWithRole: (payload: Payload, tenants: Array<TenantLookup>) => {
    return lookupTenantWithRole(payload, tenants);
  },

  /**
   * Store user email and user id in map.
   *
   * @param email - The email of the user.
   * @param userId - The id of the user.
   */
  storeUser: (email: string, userId: number) => {
    mapper.user.set(email, userId);
  },
  /**
   * Lookup user id by email.
   *
   * @param payload - The payload instance.
   * @param users - The users to lookup.
   */
  lookupUser: (payload: Payload, users: Array<UserLookup>) => {
    return lookupUser(payload, users);
  }
};

function lookupCategory(
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

function lookupMedia(payload: Payload, media: Array<MapKey>): Array<number> {
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

function lookupPage(payload: Payload, pages: Array<MapKey>): Array<number> {
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

function lookupTag(payload: Payload, tags: Array<MapKey>): Array<number> {
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

function lookupUser(payload: Payload, users: Array<UserLookup>): Array<number> {
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

function lookupTenant(
  payload: Payload,
  tenants: Array<TenantLookupApiKey>
): Array<TenantId> {
  return tenants.reduce((acc, tenant) => {
    const tenantId = mapper.tenant.get(tenant.lookupApiKey);
    if (!tenantId) {
      payload.logger.error(`Skip: Tenant '${tenant.lookupApiKey}' not found`);
      return acc;
    }
    acc.push({ tenant: tenantId });
    return acc;
  }, [] as Array<TenantId>);
}

function lookupTenantWithRole(
  payload: Payload,
  tenants: Array<TenantLookup>
): Array<TenantIdRole> {
  return tenants.reduce((acc, tenant) => {
    const tenantId = mapper.tenant.get(tenant.lookupApiKey);
    if (!tenantId) {
      payload.logger.error(`Skip: Tenant '${tenant.lookupApiKey}' not found`);
      return acc;
    }
    acc.push({ tenant: tenantId, role: tenant.role });
    return acc;
  }, [] as Array<TenantIdRole>);
}
