import {
  BlocksFeature,
  HeadingFeature,
  lexicalEditor
} from '@payloadcms/richtext-lexical';
import type { CollectionConfig } from 'payload';

import { codeBlock } from '@codeware/app-cms/ui/blocks';

import { canReadTenantScope } from '../../access/can-read-tenant-scope';
import { slug } from '../../fields/slug/slug.field';
import { tenant } from '../../fields/tenant/tenant.field';
import { populatePublishedAt } from '../../hooks/populate-published-at';

/**
 * Pages collection
 */
const pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    defaultColumns: ['name', 'slug', 'tenant', 'publishedAt'],
    useAsTitle: 'name'
  },
  labels: {
    singular: { en: 'Page', sv: 'Sida' },
    plural: { en: 'Pages', sv: 'Sidor' }
  },
  access: {
    read: canReadTenantScope
  },
  hooks: {
    beforeChange: [populatePublishedAt]
  },
  fields: [
    {
      name: 'header',
      label: { en: 'Header', sv: 'Rubrik' },
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: {
          en: 'The header of the page. Will be displayed at the top of the page.',
          sv: 'Sidans rubrik. Kommer att visas högst upp på sidan.'
        }
      }
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: { en: 'Content', sv: 'InnehållX' },
          fields: [
            {
              name: 'content',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => [
                  ...rootFeatures,
                  HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
                  BlocksFeature({ blocks: [codeBlock] })
                ]
              }),
              label: false,
              localized: true,
              admin: {
                description: {
                  en: 'The main content of the page.',
                  sv: 'Sidans huvudinnehåll.'
                }
              }
            }
          ]
        }
      ]
    },
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
        },
        position: 'sidebar'
      }
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
    slug({ sourceField: 'name' }),
    tenant
  ]
};

export default pages;
