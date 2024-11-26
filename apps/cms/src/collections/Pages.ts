import { slateEditor } from '@payloadcms/richtext-slate';
import { CollectionConfig } from 'payload/types';

import { slugField } from '../fields/slug';
import { populatePublishedAt } from '../hooks/populate-published-at';

const Pages: CollectionConfig = {
  slug: 'pages',
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
      name: 'header',
      label: { en: 'Header', sv: 'Rubrik' },
      type: 'text',
      localized: true,
      required: true,
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
      editor: slateEditor({}),
      localized: true,
      required: false,
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
      editor: slateEditor({}),
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
    }
  ],
  hooks: {
    beforeChange: [populatePublishedAt]
  }
};

export default Pages;
