import path from 'path';
import { fileURLToPath } from 'url';

import type { CollectionConfig, GenerateImageName } from 'payload';

import { adminGroups } from '@codeware/app-cms/util/definitions';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/** Custom image name */
const imageName: GenerateImageName = ({ extension, originalName, sizeName }) =>
  `${originalName}-${sizeName}.${extension}`;

/**
 * Media images collection.
 *
 * Upload limited to `image/*` mime types and images are converted to webp format.
 */
const media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: adminGroups.fileArea,
    defaultColumns: ['filename', 'alt', 'tenant', 'updatedAt'],
    description: {
      en: 'Media images to use in posts and pages.',
      sv: 'Bilder som kan användas i inlägg och sidor.'
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
  upload: {
    mimeTypes: ['image/*'],
    // Uploaded image is converted to a backward compatible format known by all browsers.
    // This image should be used as the default image in a `<picture />` element.
    formatOptions: { format: 'jpeg' },
    resizeOptions: { width: 1600 },
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        height: 300,
        formatOptions: { format: 'webp' },
        generateImageName: imageName
      },
      {
        name: 'small',
        width: 600,
        formatOptions: { format: 'webp' },
        generateImageName: imageName
      },
      {
        name: 'medium',
        width: 900,
        formatOptions: { format: 'webp' },
        generateImageName: imageName
      },
      {
        name: 'large',
        width: 1400,
        formatOptions: { format: 'webp' },
        generateImageName: imageName
      },
      {
        name: 'meta',
        width: 1200,
        height: 630,
        crop: 'center',
        fit: 'inside',
        formatOptions: { format: 'webp' },
        generateImageName: imageName
      }
    ],
    adminThumbnail: 'thumbnail',
    displayPreview: true,
    focalPoint: true,
    // Local storage will be disabled when S3 storage is configured.
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload.
    staticDir: path.resolve(dirname, '../../../public/media')
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      admin: {
        description: {
          en: 'Alternative text for SEO and accessibility.',
          sv: 'Alternativ text för SEO och tillgänglighet.'
        }
      },
      required: true
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
  ]
};

export default media;
