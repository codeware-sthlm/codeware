import {
  HTMLConverterFeature,
  lexicalEditor,
  lexicalHTML
} from '@payloadcms/richtext-lexical';
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
      name: 'intro',
      label: { en: 'Intro', sv: 'Inledning' },
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          // The HTMLConverter Feature is the feature which manages the HTML serializers.
          // If you do not pass any arguments to it, it will use the default serializers.
          HTMLConverterFeature({})
        ]
      }),
      localized: true,
      admin: {
        description: {
          en: 'The introduction of the page. Will be displayed below the header.',
          sv: 'Sidans inledning. Kommer att visas under rubriken.'
        }
      }
    },
    {
      name: 'content',
      label: { en: 'Content', sv: 'Innehåll' },
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          // The HTMLConverter Feature is the feature which manages the HTML serializers.
          // If you do not pass any arguments to it, it will use the default serializers.
          HTMLConverterFeature({})
        ]
      }),
      localized: true,
      admin: {
        description: {
          en: 'The main content of the page. Will be displayed below the intro.',
          sv: 'Sidans huvudinnehåll. Kommer att visas under inledningen.'
        }
      }
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
    lexicalHTML('content', {
      name: 'content_html'
    }),
    lexicalHTML('intro', {
      name: 'intro_html'
    }),
    slug('pages'),
    tenant
  ]
};

export default pages;
