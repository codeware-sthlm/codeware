import type { CollectionConfig } from 'payload';

import { getEnv } from '@codeware/app-cms/feature/env-loader';
import {
  systemUserOrTenantAdminAccess,
  verifyApiKeyAccess
} from '@codeware/app-cms/util/access';
import { adminGroups } from '@codeware/app-cms/util/definitions';

const env = getEnv();

/**
 * Site settings collection.
 */
const siteSettings: CollectionConfig = {
  slug: 'site-settings',
  admin: {
    group: adminGroups.settings
  },
  access: {
    read: verifyApiKeyAccess({
      secret: env.SIGNATURE_SECRET
    }),
    update: systemUserOrTenantAdminAccess
  },
  labels: {
    singular: { en: 'Site Settings', sv: 'Webbplatsinställningar' },
    plural: { en: 'Site Settings', sv: 'Webbplatsinställningar' }
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          name: 'general',
          fields: [
            {
              name: 'appName',
              type: 'text',
              label: { en: 'Application name', sv: 'Namnet på applikationen' },
              required: true
            },
            {
              name: 'landingPage',
              type: 'relationship',
              relationTo: 'pages',
              label: { en: 'Landing page', sv: 'Startsida' },
              admin: {
                description: {
                  en: 'The page that will be used as the landing page for the application.',
                  sv: 'Sidan som kommer att användas som startsida för applikationen.'
                }
              },
              index: true,
              required: true
            }
          ]
        }
      ]
    }
  ]
};

export default siteSettings;
