import { slateEditor } from '@payloadcms/richtext-slate';
import { CollectionConfig } from 'payload/types';

import formatSlug from '../hooks/format-slug';
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
      localized: true
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      required: true,
      index: true,
      hooks: {
        beforeValidate: [formatSlug('title')]
      }
    },
    {
      name: 'intro',
      label: { en: 'Intro', sv: 'Inledning' },
      type: 'richText',
      editor: slateEditor({}),
      localized: true,
      required: false
    },
    {
      name: 'content',
      label: { en: 'Content', sv: 'Innehåll' },
      type: 'richText',
      editor: slateEditor({}),
      localized: true,
      required: false
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
