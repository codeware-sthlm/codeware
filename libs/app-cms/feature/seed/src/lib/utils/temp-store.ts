import type { TenantRole } from '@codeware/shared/util/payload-types';
import type {
  CategoryLookup,
  TenantLookup,
  UserLookup
} from '@codeware/shared/util/seed';
import type { Payload } from 'payload';

type TenantId = { tenant: number };
type TenantIdRole = { tenant: number; role: TenantRole };
type TenantLookupApiKey = Pick<TenantLookup, 'lookupApiKey'>;

const mapper = {
  // Map category slug to category id
  category: new Map<string, number>(),

  // Map api key to tenant id
  tenant: new Map<string, number>(),

  // Map name to user id
  user: new Map<string, number>()
};

/**
 * Temporary store.
 *
 * This is used to store and lookup ids.
 */
export const tempStore = {
  /**
   * Store category slug and id in map.
   *
   * @param slug - The slug of the category.
   * @param categoryId - The id of the category.
   */
  storeCategory: (slug: string, categoryId: number) => {
    mapper.category.set(slug, categoryId);
  },
  /**
   * Lookup category id by slug.
   *
   * @param payload - The payload instance.
   * @param categories - The categories to lookup.
   */
  lookupCategory: (payload: Payload, categories: Array<CategoryLookup>) => {
    return lookupCategory(payload, categories);
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
  categories: Array<CategoryLookup>
): Array<number> {
  return categories.reduce((acc, category) => {
    const categoryId = mapper.category.get(category.lookupSlug);
    if (!categoryId) {
      payload.logger.error(`Skip: Category '${category.lookupSlug}' not found`);
      return acc;
    }
    acc.push(categoryId);
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
