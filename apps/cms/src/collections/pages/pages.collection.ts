import type { CollectionConfig } from 'payload';

import { getEnv } from '@codeware/app-cms/feature/env-loader';
import { slugField } from '@codeware/app-cms/ui/fields';
import { seoTab } from '@codeware/app-cms/ui/tabs';
import { verifyApiKeyAccess } from '@codeware/app-cms/util/access';
import { adminGroups } from '@codeware/app-cms/util/definitions';
import { populatePublishedAtHook } from '@codeware/app-cms/util/hooks';

const env = getEnv();

/**
 * Pages collection
 */
const pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  admin: {
    group: adminGroups.content,
    defaultColumns: ['name', 'slug', 'tenant', 'updatedAt'],
    useAsTitle: 'name',
    description: {
      en: 'Pages are the building blocks of the site and are used to create menus and navigation.',
      sv: 'Sidor är webbsidans byggstenar och används för att skapa menyer och navigering.'
    }
  },
  access: {
    read: verifyApiKeyAccess({ secret: env.SIGNATURE_SECRET })
  },
  labels: {
    singular: { en: 'Page', sv: 'Sida' },
    plural: { en: 'Pages', sv: 'Sidor' }
  },
  hooks: {
    beforeChange: [populatePublishedAtHook]
  },
  fields: [
    {
      name: 'name',
      label: { en: 'Name', sv: 'Namn' },
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: {
          en: 'The name of the page used for navigation links.',
          sv: 'Sidans namn som används för navigeringslänkar.'
        }
      }
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: { en: 'Content', sv: 'Innehåll' },
          fields: [
            {
              name: 'header',
              type: 'text',
              label: { en: 'Header', sv: 'Rubrik' },
              required: false,
              localized: true,
              admin: {
                description: {
                  en: 'A pre-designed header on top of the page. Provide for a consistent look and feel or customize everything in "Layout builder".',
                  sv: 'En fördefinierad rubrik längst upp på sidan. Använd för att skapa ett konsekvent utseende, alternativt anpassa allt i "Layout builder".'
                }
              },
              defaultValue: ''
            },
            {
              name: 'layout',
              type: 'blocks',
              label: 'Layout builder',
              blockReferences: [
                'content',
                'card',
                'form',
                'media',
                'code',
                'reusable-content'
              ],
              blocks: [],
              required: true,
              localized: true,
              admin: {
                description: {
                  en: 'Build the page content by adding the layout blocks you need.',
                  sv: 'Bygg sidan genom att lägga till de layout-block du behöver.'
                },
                disableListColumn: true,
                initCollapsed: true
              }
            }
          ]
        },
        seoTab
      ]
    },
    {
      name: 'publishedAt',
      label: { en: 'Published At', sv: 'Publicerad' },
      type: 'date',
      admin: {
        date: { displayFormat: 'yyyy-MM-dd' },
        description: {
          en: 'The date the page is published.',
          sv: 'Datumet då sidan publiceras.'
        },
        position: 'sidebar'
      }
    },
    slugField({ sourceField: 'name' })
  ]
};

export default pages;
