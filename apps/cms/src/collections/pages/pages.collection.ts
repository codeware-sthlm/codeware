import type { CollectionConfig } from 'payload/types';

import { canMutateTenantScope } from '../../access/can-mutate-tenant-scope';
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
    // TODO: Payload v3?
    // baseListFilter,
    defaultColumns: ['title', 'slug', 'tenant', 'publishedAt'],
    useAsTitle: 'title'
  },
  labels: {
    singular: { en: 'Page', sv: 'Sida' },
    plural: { en: 'Pages', sv: 'Sidor' }
  },
  access: {
    create: canMutateTenantScope,
    delete: canMutateTenantScope,
    read: canReadTenantScope,
    update: canMutateTenantScope
  },
  hooks: {
    beforeChange: [populatePublishedAt]
  },
  fields: [
    {
      name: 'title',
      label: { en: 'Title', sv: 'Titel' },
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: {
          en: 'The title of the page. Will be displayed in the browser tab, page meta property and in navigation.',
          sv: 'Sidans titel. Kommer att visas i webbläsarens flik, sidans metaegenskaper och i navigeringen.'
        }
      }
    },
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
          label: { en: 'Content', sv: 'Innehåll' },
          fields: [
            {
              name: 'content',
              type: 'richText',
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
      name: 'publishedAt',
      label: { en: 'Published At', sv: 'Publicerad' },
      type: 'date',
      admin: {
        date: { displayFormat: 'yyyy-MM-dd' },
        position: 'sidebar'
      }
    },
    slug('pages'),
    tenant
  ]
};

export default pages;
