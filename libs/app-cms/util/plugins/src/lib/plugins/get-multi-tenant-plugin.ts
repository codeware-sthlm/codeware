import { hasRole } from '@codeware/app-cms/util/misc';
import type { Config } from '@codeware/shared/util/payload-types';
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant';

export const getMultiTenantPlugin = () =>
  multiTenantPlugin<Config>({
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
