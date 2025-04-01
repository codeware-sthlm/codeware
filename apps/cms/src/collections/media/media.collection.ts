import path from 'path';
import { fileURLToPath } from 'url';

import type { CollectionConfig } from 'payload';

import { adminGroups } from '@codeware/app-cms/util/definitions';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/**
 * Media collection
 */
const media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: adminGroups.fileArea,
    defaultColumns: ['filename', 'mimeType', 'tenant', 'createdAt'],
    description: {
      en: 'Media files currently only support images and can be used in posts and pages.',
      sv: 'Media stödjer för närvarande endast bilder och kan användas i inlägg och sidor.'
    }
  },
  access: {
    // Media files like images are not fetched, hence no api key to verify.
    // For admin access, the plugin appends proper permission filters.
    read: () => true
  },
  labels: {
    singular: { en: 'Media', sv: 'Media' },
    plural: { en: 'Media', sv: 'Media' }
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      admin: {
        description: {
          en: 'The alternative text for the media.',
          sv: 'Alternativ text för media.'
        }
      }
    },
    {
      name: 'caption',
      type: 'richText',
      localized: true,
      admin: {
        description: {
          en: 'The caption for the media.',
          sv: 'Bildtext för media.'
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
              on: 'heroImage'
            }
          ]
        }
      ]
    }
  ],
  upload: {
    // Local storage will be disabled when S3 storage is configured.
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload.
    staticDir: path.resolve(dirname, '../../../public/media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300
      },
      {
        name: 'square',
        width: 500,
        height: 500
      },
      {
        name: 'small',
        width: 600
      },
      {
        name: 'medium',
        width: 900
      },
      {
        name: 'large',
        width: 1400
      },
      {
        name: 'xlarge',
        width: 1920
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center'
      }
    ]
  }
};

export default media;
