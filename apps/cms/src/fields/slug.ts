import type { Field } from 'payload/types';

import formatSlug from '../hooks/format-slug';

type Slug = (fieldToUse?: string) => Field;

export const slugField: Slug = (fieldToUse = 'title') => ({
  name: 'slug',
  type: 'text',
  required: true,
  admin: {
    description: {
      en: 'The URL slug for this page. Will be automatically generated from the title if left empty.',
      sv: 'URL-slug för sidan. Genereras automatiskt från titeln om det lämnas tomt.'
    },
    position: 'sidebar'
  },
  hooks: {
    beforeValidate: [formatSlug(fieldToUse)]
  },
  index: true,
  label: 'Slug'
});
