import type { Block } from 'payload';

/**
 * Media block for displaying an image media element.
 *
 * Note! Currently only images are supported.
 */
export const mediaBlock: Block = {
  slug: 'media',
  interfaceName: 'MediaBlock',
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      filterOptions: {
        mimeType: { contains: 'image' }
      },
      required: true
    }
  ]
};
