import type { Block } from 'payload';

/**
 * Image block for displaying an image from media collection.
 *
 * Exposes the `ImageBlock` interface.
 */
export const imageBlock: Block = {
  slug: 'image',
  interfaceName: 'ImageBlock',
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      filterOptions: {
        mimeType: { contains: 'image' }
      },
      admin: {
        description: {
          en: 'Select an image.',
          sv: 'Välj en bild.'
        }
      },
      required: true
    }
  ]
};
