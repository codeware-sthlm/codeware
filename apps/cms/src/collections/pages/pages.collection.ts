import type { CollectionConfig } from 'payload';

import { slugField, tenantField } from '@codeware/app-cms/ui/fields';
import { seoTab } from '@codeware/app-cms/ui/tabs';
import {
  canReadTenantScopeAccess,
  populatePublishedAtHook
} from '@codeware/app-cms/util/functions';

/**
 * Pages collection
 */
const pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  admin: {
    defaultColumns: ['name', 'slug', 'tenant', 'updatedAt'],
    useAsTitle: 'name'
  },
  labels: {
    singular: { en: 'Page', sv: 'Sida' },
    plural: { en: 'Pages', sv: 'Sidor' }
  },
  access: {
    read: canReadTenantScopeAccess
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
          en: 'The name of the page used in navigation. Will also be displayed in the browser tab and page meta property.',
          sv: 'Sidans namn som används i navigeringen. Kommer också att visas i webbläsarens flik och sidans meta-egenskaper.'
        }
      }
    },
    {
      type: 'tabs',
      tabs: [
        // TODO: Maybe here or as a block
        // {
        //   label: 'Hero',
        //   fields: []
        // },
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
              blockReferences: ['content', 'media', 'code'],
              blocks: [],
              required: true,
              localized: true,
              admin: {
                description: {
                  en: 'Build the page content by adding the layout blocks you need.',
                  sv: 'Bygg sidan genom att lägga till de layout-block du behöver.'
                },
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
    slugField({ sourceField: 'name' }),
    tenantField
  ]
};

export default pages;
