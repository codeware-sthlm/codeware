import type { Block } from 'payload';

/**
 * Video block for displaying a video from media collection.
 *
 * Exposes the `VideoBlock` interface.
 */
export const videoBlock: Block = {
  slug: 'video',
  interfaceName: 'VideoBlock',
  labels: {
    plural: { en: 'Videos', sv: 'Videor' },
    singular: { en: 'Video', sv: 'Video' }
  },
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      filterOptions: {
        mimeType: { contains: 'video' }
      },
      admin: {
        description: {
          en: 'Select a video.',
          sv: 'Välj en video.'
        }
      },
      required: true
    }
  ]
};
