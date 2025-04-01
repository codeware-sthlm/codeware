import type { CollectionConfig } from 'payload';

import { getEnv } from '@codeware/app-cms/feature/env-loader';
import { slugField } from '@codeware/app-cms/ui/fields';
import { verifyApiKeyAccess } from '@codeware/app-cms/util/access';
import { adminGroups } from '@codeware/app-cms/util/definitions';

const env = getEnv();

/**
 * Categories collection
 */
const categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    group: adminGroups.content,
    defaultColumns: ['name', 'slug', 'tenant'],
    useAsTitle: 'name'
  },
  access: {
    read: verifyApiKeyAccess({ secret: env.SIGNATURE_SECRET })
  },
  labels: {
    singular: { en: 'Category', sv: 'Kategori' },
    plural: { en: 'Categories', sv: 'Kategorier' }
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      localized: true,
      required: true,
      admin: {
        description: {
          en: 'The name of the category.',
          sv: 'Namnet på kategorin.'
        }
      }
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: { en: 'Posts', sv: 'Inlägg' },
          fields: [
            {
              name: 'relatedPosts',
              label: { en: 'Posts', sv: 'Inlägg' },
              type: 'join',
              collection: 'posts',
              on: 'categories'
            }
          ]
        }
      ]
    },
    slugField({ sourceField: 'name' })
  ]
};

export default categories;
