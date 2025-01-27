import type { CollectionConfig } from 'payload/types';

import { canMutateTenantScope } from '../../access/can-mutate-tenant-scope';
import { canReadTenantScope } from '../../access/can-read-tenant-scope';
import { slug } from '../../fields/slug/slug.field';
import { tenant } from '../../fields/tenant/tenant.field';
import { populatePublishedAt } from '../../hooks/populate-published-at';

/**
 * Articles collection
 */
const articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    defaultColumns: ['title', 'slug', 'tenant', 'publishedAt'],
    useAsTitle: 'title'
  },
  labels: {
    singular: { en: 'Article', sv: 'Artikel' },
    plural: { en: 'Articles', sv: 'Artiklar' }
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
      name: 'author',
      label: { en: 'Author', sv: 'Författare' },
      type: 'text',
      required: true,
      admin: {
        description: {
          en: 'The author of the article.',
          sv: 'Artikelns författare.'
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
                  en: 'The main content of the article.',
                  sv: 'Artikelns huvudinnehåll.'
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
    slug('articles'),
    tenant
  ]
};

export default articles;
