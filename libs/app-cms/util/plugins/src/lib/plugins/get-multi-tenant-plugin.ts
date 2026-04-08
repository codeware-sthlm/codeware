import { getUserTenantIDs, hasRole } from '@codeware/app-cms/util/misc';
import type { Config } from '@codeware/shared/util/payload-types';
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant';

export const getMultiTenantPlugin = () =>
  multiTenantPlugin<Config>({
    // Default values, but specified for clarity
    cleanupAfterTenantDelete: true,
    debug: false,
    tenantsSlug: 'tenants',
    tenantField: {
      name: 'tenant',
      // Prevent users from assigning content to a tenant they don't belong to.
      // System users are unrestricted.
      // `siblingData.tenant` holds the incoming tenant ID (number) for top-level
      // fields; `value` does not exist in Payload's FieldAccessArgs.
      access: {
        create: ({ req: { user }, siblingData }) => {
          if (!user) return false;
          if (hasRole(user, 'system-user')) return true;
          const userTenantIds = getUserTenantIDs(user);
          return userTenantIds.includes(siblingData?.['tenant'] as number);
        },
        update: ({ req: { user }, siblingData }) => {
          if (!user) return false;
          if (hasRole(user, 'system-user')) return true;
          const userTenantIds = getUserTenantIDs(user);
          return userTenantIds.includes(siblingData?.['tenant'] as number);
        }
      }
    },
    collections: {
      categories: {},
      forms: {},
      'form-submissions': {},
      navigation: { isGlobal: true },
      media: {},
      pages: {},
      posts: {},
      'reusable-content': {},
      'site-settings': { isGlobal: true },
      tags: {}
    },
    tenantsArrayField: {
      includeDefaultField: false
    },
    tenantSelectorLabel: { en: 'Workspace scope', sv: 'Vald arbetsyta' },
    userHasAccessToAllTenants: (user) => hasRole(user, 'system-user')
  });
