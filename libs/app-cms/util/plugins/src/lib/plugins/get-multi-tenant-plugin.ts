import { hasRole } from '@codeware/app-cms/util/misc';
import type { Config } from '@codeware/shared/util/payload-types';
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant';

export const getMultiTenantPlugin = () => {
  return multiTenantPlugin<Config>({
    // Default values, but specified for clarity
    cleanupAfterTenantDelete: true,
    debug: false,
    tenantsSlug: 'tenants',
    tenantField: {
      name: 'tenant'
    },
    collections: {
      categories: {},
      forms: {},
      'form-submissions': {},
      media: {},
      pages: {},
      posts: {},
      'site-settings': { isGlobal: true }
    },
    tenantsArrayField: {
      includeDefaultField: false
    },
    tenantSelectorLabel: { en: 'Workspace scope', sv: 'Vald arbetsyta' },
    userHasAccessToAllTenants: (user) => hasRole(user, 'system-user')
  });
};
