import type { Field } from 'payload';

import { ensureUniqueSlug } from './hooks/ensure-unique-slug';
import { formatSlug } from './hooks/format-slug';

type Slug = (args: {
  /** The field to use as a source for the slug when a slug is not provided. */
  sourceField: string;
  /** Whether the slug is required. Defaults to `false`. */
  required?: boolean;
  /** The maximum length of the slug. Defaults to no limit. */
  maxLength?: number;
}) => Field;

/** The name of the slug field */
export const slugName = 'slug' as const;

/**
 * Adds an indexed slug field to the sidebar.
 *
 * Makes a slug text from the provided source field when a slug value is not provided.
 *
 * Also assures that the slug is unique across the collection and tenant.
 */
export const slugField: Slug = ({
  sourceField,
  required = false,
  maxLength
}) => ({
  name: slugName,
  type: 'text',
  index: true,
  required,
  maxLength,
  label: 'Slug',
  admin: {
    description: {
      en: `Used for url paths. Will be automatically generated from ${sourceField} if left empty.`,
      sv: `Används för url-sökvägar. Genereras automatiskt från ${sourceField} om den lämnas tomt.`
    },
    position: 'sidebar'
  },
  hooks: {
    beforeValidate: [formatSlug(sourceField), ensureUniqueSlug]
  }
});
