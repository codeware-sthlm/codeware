import type { Field } from 'payload/types';

import type { CollectionSlug } from '../../utils/custom-types';

import { ensureUniqueSlug } from './hooks/ensure-unique-slug';
import formatSlug from './hooks/format-slug';

type Slug = (
  collection: CollectionSlug,
  args?: { parentField?: string; required?: boolean }
) => Field;

/**
 * Adds an indexed slug field to the sidebar.
 *
 * Makes a slug text from the parent field when not provided.
 */
export const slug: Slug = (
  collection,
  { parentField = 'title', required = false } = {}
) => ({
  name: 'slug',
  type: 'text',
  index: true,
  required,
  label: 'Slug',
  admin: {
    description: {
      en: 'Used for url paths. Will be automatically generated if left empty.',
      sv: 'Används för url-sökvägar. Genereras automatiskt om den lämnas tomt.'
    },
    position: 'sidebar'
  },
  hooks: {
    beforeValidate: [formatSlug(parentField), ensureUniqueSlug(collection)]
  }
});
