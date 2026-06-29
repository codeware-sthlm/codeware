import type { CollectionConfig, Condition } from 'payload';

import { systemUserOrTenantAdminAccess } from '@codeware/app-cms/util/access';
import { adminGroups } from '@codeware/app-cms/util/definitions';
import { customT } from '@codeware/app-cms/util/i18n';
import { findTenantFromCookie } from '@codeware/app-cms/util/misc';
import type {
  SiteSetting,
  SiteSettingsGeneral,
  SiteSettingsIconSource
} from '@codeware/shared/util/payload-types';

import { userOrApiKeyAccess } from '../../security/user-or-api-key-access';

import { sanitizeSvgHook } from './hooks/sanitize-svg.hook';

const isSource =
  (
    source: SiteSettingsIconSource
  ): Condition<SiteSetting, SiteSettingsGeneral['icon']> =>
  (_, siblingData) =>
    siblingData?.source === source;

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
  hooks: {
    beforeChange: [sanitizeSvgHook]
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
          interfaceName: 'SiteSettingsGeneral',
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
              name: 'icon',
              type: 'group',
              label: { en: 'Icon', sv: 'Ikon' },
              admin: {
                description: {
                  en: 'Optional tenant brand mark - use for a more unique identity.',
                  sv: 'Valfritt varumärke för klienten - använd för en mer unik identitet.'
                }
              },
              fields: [
                {
                  name: 'source',
                  type: 'select',
                  label: { en: 'Source', sv: 'Källa' },
                  options: [
                    { label: { en: 'SVG code', sv: 'SVG-kod' }, value: 'svg' },
                    {
                      label: { en: 'Upload image', sv: 'Ladda upp bild' },
                      value: 'upload'
                    }
                  ]
                },
                {
                  name: 'svgCode',
                  type: 'textarea',
                  label: { en: 'SVG code', sv: 'SVG-kod' },
                  admin: {
                    condition: isSource('svg'),
                    description: {
                      en: 'Paste raw SVG markup or generate a geometric icon. The viewBox attribute is required for correct scaling.',
                      sv: 'Klistra in SVG-markup eller generera en geometrisk ikon. Attributet viewBox krävs för korrekt skalning.'
                    },
                    components: {
                      Field:
                        '@codeware/apps/cms/components/SvgPreviewField.client'
                    }
                  }
                },
                {
                  name: 'file',
                  type: 'upload',
                  relationTo: 'media',
                  label: { en: 'Image', sv: 'Bild' },
                  filterOptions: {
                    or: [{ mimeType: { contains: 'image/' } }]
                  },
                  admin: {
                    condition: isSource('upload'),
                    description: {
                      en: 'Upload an image. Use the crop tool to select a 1:1 region.',
                      sv: 'Ladda upp en bild. Använd beskärningsverktyget för att välja ett 1:1-område.'
                    },
                    components: {
                      Field:
                        '@codeware/app-cms/ui/fields/icon-crop/IconCropField.client'
                    }
                  }
                }
              ]
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
