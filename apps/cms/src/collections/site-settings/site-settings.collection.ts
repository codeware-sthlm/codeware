import type { CollectionConfig } from 'payload';

import { systemUserOrTenantAdminAccess } from '@codeware/app-cms/util/access';
import { adminGroups } from '@codeware/app-cms/util/definitions';
import { customT } from '@codeware/app-cms/util/i18n';
import { findTenantFromCookie } from '@codeware/app-cms/util/misc';

import { userOrApiKeyAccess } from '../../security/user-or-api-key-access';

/**
 * Site settings collection.
 */
const siteSettings: CollectionConfig = {
  slug: 'site-settings',
  admin: {
    group: adminGroups.settings
  },
  access: {
    read: userOrApiKeyAccess(),
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
          label: { en: 'General', sv: 'Allmänt' },
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
              hasMany: false,
              label: { en: 'Landing page', sv: 'Startsida' },
              admin: {
                description: {
                  en: 'The page that will be used as the landing page for the application.',
                  sv: 'Sidan som kommer att användas som startsida för applikationen.'
                }
              },
              required: true
            },
            {
              name: 'defaultLocale',
              type: 'select',
              options: [
                { label: { en: 'English', sv: 'Engelska' }, value: 'en' },
                { label: { en: 'Swedish', sv: 'Svenska' }, value: 'sv' }
              ],
              hasMany: false, // Infer correct types for validation
              validate: async (value, { req }) => {
                const tenant = await findTenantFromCookie(req);
                if (!tenant || !value) {
                  return true;
                }
                const locales = tenant.supportedLocales.map(String);
                if (locales.includes(value)) {
                  return true;
                }
                return customT(req.t)('validation:notSupportedLocale', {
                  locale: value,
                  locales: locales.join(', ') || 'none'
                });
              },
              label: { en: 'Default locale', sv: 'Primärt språk' },
              admin: {
                description: {
                  en: 'The default locale for the client. Must be one of the supported locales for the workspace.',
                  sv: 'Primärt språk för klienten. Måste vara ett av de språk som stöds av arbetsytan.'
                }
              },
              required: true
            }
          ]
        }
      ]
    }
  ]
};

export default siteSettings;
