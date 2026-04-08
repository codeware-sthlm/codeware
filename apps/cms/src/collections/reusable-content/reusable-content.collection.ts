import type { CollectionConfig } from 'payload';

import { adminGroups } from '@codeware/app-cms/util/definitions';
import { BlockSlug } from '@codeware/shared/util/payload-types';
import { getActiveKeys } from '@codeware/shared/util/pure';

import { userOrApiKeyAccess } from '../../security/user-or-api-key-access';

/**
 * Define which blocks are available for the layout builder.
 */
// Using a record to make sure all blocks are included and not forgotten
const blocks: Record<BlockSlug, boolean> = {
  card: true,
  code: true,
  content: true,
  'file-area': true,
  form: true,
  image: true,
  media: true,
  'social-media': true,
  spacing: true,
  'reusable-content': false,
  video: false
};

/**
 * Reusable content collection
 */
const reusableContent: CollectionConfig = {
  slug: 'reusable-content',
  access: {
    read: userOrApiKeyAccess()
  },
  admin: {
    group: adminGroups.content,
    useAsTitle: 'title',
    description: {
      en: 'Reusable content is a collection of blocks that can be combined freely and used in various places.',
      sv: 'Återanvändbara element är en samling block som kan kombineras fritt och användas på olika ställen.'
    }
  },
  labels: {
    plural: { en: 'Reusable Contents', sv: 'Återanvändbara element' },
    singular: { en: 'Reusable Content', sv: 'Återanvändbart element' }
  },
  fields: [
    {
      name: 'title',
      label: { en: 'Title', sv: 'Titel' },
      type: 'text',
      required: true,
      admin: {
        description: {
          en: 'What is the reusable content about? This is just an internal help text to keep the content organized.',
          sv: 'Vad handlar det återanvändbara elementet om? Detta är bara en intern hjälptext för att hålla ordning på innehållet.'
        }
      }
    },
    {
      name: 'layout',
      type: 'blocks',
      label: { en: 'Layout builder', sv: 'Innehållsbyggaren' },
      labels: {
        singular: { en: 'block', sv: 'block' },
        plural: { en: 'blocks', sv: 'block' }
      },
      blockReferences: getActiveKeys<BlockSlug>(blocks),
      blocks: [],
      required: true
    }
  ]
};

export default reusableContent;
