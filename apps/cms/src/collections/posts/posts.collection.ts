import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { HeadingFeature } from '@payloadcms/richtext-lexical';
import { BlocksFeature } from '@payloadcms/richtext-lexical';
import type { CollectionConfig } from 'payload';

import { slugField, tenantField } from '@codeware/app-cms/ui/fields';
import { seoTab } from '@codeware/app-cms/ui/tabs';
import { canReadTenantScopeAccess } from '@codeware/app-cms/util/functions';

import { updatePublishedAtHook } from './hooks/update-published-at.hook';

/**
 * Posts collection
 */
const posts: CollectionConfig<'posts'> = {
  slug: 'posts',
  admin: {
    defaultColumns: ['title', 'tenant', 'updatedAt'],
    useAsTitle: 'title'
  },
  labels: {
    singular: { en: 'Post', sv: 'Inlägg' },
    plural: { en: 'Posts', sv: 'Inlägg' }
  },
  access: {
    read: canReadTenantScopeAccess
  },
  // hooks: {
  //   afterRead: [populateAuthorsHook]
  // },
  fields: [
    {
      name: 'title',
      label: { en: 'Title', sv: 'Titel' },
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: {
          en: 'The title of the post and name used in navigation.',
          sv: 'Inläggs titel och namn som används i navigering.'
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
              name: 'heroImage',
              type: 'upload',
              relationTo: 'media'
            },
            {
              name: 'content',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => [
                  ...rootFeatures,
                  HeadingFeature({
                    enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4']
                  }),
                  BlocksFeature({ blocks: ['code', 'media'] })
                ]
              }),
              label: false,
              localized: true,
              required: true,
              admin: {
                description: {
                  en: 'The main content of the article.',
                  sv: 'Artikelns huvudinnehåll.'
                }
              }
            }
          ]
        },
        {
          label: 'Meta',
          fields: [
            {
              name: 'relatedPosts',
              type: 'relationship',
              label: { en: 'Related Posts', sv: 'Relaterade inlägg' },
              admin: {
                position: 'sidebar'
              },
              filterOptions: ({ id }) => ({ id: { not_in: [id] } }),
              hasMany: true,
              relationTo: 'posts'
            },
            {
              name: 'categories',
              type: 'relationship',
              label: { en: 'Categories', sv: 'Kategorier' },
              admin: {
                position: 'sidebar'
              },
              hasMany: true,
              relationTo: 'categories'
            }
          ]
        },
        seoTab
      ]
    },
    {
      name: 'publishedAt',
      label: { en: 'Published At', sv: 'Publiceras' },
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        position: 'sidebar'
      },
      hooks: {
        beforeChange: [updatePublishedAtHook]
      }
    },
    {
      name: 'authors',
      label: { en: 'Authors', sv: 'Författare' },
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      admin: {
        description: {
          en: 'The authors of the post.',
          sv: 'Författare till inlägget.'
        },
        position: 'sidebar'
      }
    },
    slugField({ sourceField: 'title' }),
    tenantField
  ]
};

export default posts;
