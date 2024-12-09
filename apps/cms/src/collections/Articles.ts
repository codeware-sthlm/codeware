import {
  HTMLConverterFeature,
  lexicalEditor,
  lexicalHTML
} from '@payloadcms/richtext-lexical';
import { CollectionConfig } from 'payload/types';

import { slugField } from '../fields/slug';

const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    defaultColumns: ['title', 'slug', 'publishedAt']
  },
  fields: [
    {
      name: 'title',
      label: { en: 'Title', sv: 'Titel' },
      type: 'text',
      required: true,
      localized: true,
      unique: true,
      admin: {
        description: {
          en: 'The title of the page. Will be displayed in the browser tab, page meta property and in navigation.',
          sv: 'Sidans titel. Kommer att visas i webbläsarens flik, sidans metaegenskaper och i navigeringen.'
        }
      }
    },
    slugField(),
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
      required: false,
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
    })
  ]
};

export default Articles;
