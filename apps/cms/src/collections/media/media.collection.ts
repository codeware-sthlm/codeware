import path from 'path';
import { fileURLToPath } from 'url';

import mimeTypes from 'mime-types';
import type {
  CollectionBeforeValidateHook,
  CollectionConfig,
  Condition,
  GenerateImageName,
  TypeWithID
} from 'payload';

import { getEnv } from '@codeware/app-cms/feature/env-loader';
import { tagsSelectField } from '@codeware/app-cms/ui/fields';
import { adminGroups, getMimeTypes } from '@codeware/app-cms/util/definitions';
import { Media } from '@codeware/shared/util/payload-types';

import { externalOrApiKeyAccess } from './access/external-or-api-key-access';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const env = getEnv();

/** Custom image name */
const imageName: GenerateImageName = ({ extension, originalName, sizeName }) =>
  `${originalName}-${sizeName}.${extension}`;

const isImageOrVideo: Condition<TypeWithID, Media> = (_, siblingData) =>
  !!siblingData.mimeType && siblingData.mimeType.match(/image|video/) !== null;

// Extracting mime type during seed has a flaky bewhavior.
// The mime type is not always available when the file is uploaded.
const ensureMimeType: CollectionBeforeValidateHook<Media> = ({
  data,
  operation
}) => {
  if (!data) {
    return data;
  }
  if (data.mimeType) {
    return data;
  }
  if (operation === 'create' || operation === 'update') {
    // Try to lookup the mime type from the filename
    data.mimeType = mimeTypes.lookup(data.filename ?? '') || undefined;
  }
  return data;
};

/**
 * Media collection for files with supported mime types.
 *
 * Uploaded images are converted to webp format.
 *
 * **Mime types**
 *
 * `@codeware/app-cms/util/definitions`
 */
const media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: adminGroups.fileArea,
    defaultColumns: ['filename', 'mimeType', 'fileSize', 'tags', 'createdAt'],
    components: {
      beforeListTable: [
        {
          path: '@codeware/app-cms/ui/components/Callout',
          serverProps: {
            kind: 'tip',
            title: 'Using tags to organize media files',
            description: [
              'Use tags to organize your media files and easily select them in file areas.',
              'Tags can be created in the "Tags" collection.',
              'You can assign multiple tags to a media file.'
            ]
          }
        }
      ]
    }
  },
  access: {
    read: externalOrApiKeyAccess(env.SIGNATURE_SECRET)
  },
  hooks: {
    beforeValidate: [ensureMimeType]
  },
  labels: {
    singular: { en: 'Media', sv: 'Media' },
    plural: { en: 'Media', sv: 'Media' }
  },
  upload: {
    mimeTypes: getMimeTypes(),
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
        condition: isImageOrVideo,
        description: {
          en: 'Caption to display below an image or video.',
          sv: 'Text som visas under en bild eller video.'
        }
      }
    },
    tagsSelectField({
      buildIndex: true,
      overrides: {
        // TODO: Would like to use 'drawer' but it doesn't work with bulk upload media.
        // Better to be safe and wait for a fix.
        admin: { appearance: 'select' }
      }
    }),
    {
      // Media files are not fetched, hence there's no api key to verify.
      // This property will be used as alternative access control for static file requests.
      name: 'external',
      type: 'checkbox',
      label: { en: 'External access', sv: 'Extern åtkomst' },
      admin: {
        description: {
          en: 'Allow external access to the file without authentication. For example, this is required for file areas and document images.',
          sv: 'Tillåt extern åtkomst till filen utan autentisering. Detta krävs till exempel för filytor och bilder i dokument.'
        },
        position: 'sidebar'
      },
      defaultValue: false
    }
  ]
};

export default media;
