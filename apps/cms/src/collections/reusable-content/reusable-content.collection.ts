import type { CollectionConfig } from 'payload';

import { getEnv } from '@codeware/app-cms/feature/env-loader';
import { verifyApiKeyAccess } from '@codeware/app-cms/util/access';
import { adminGroups } from '@codeware/app-cms/util/definitions';
import { BlockSlug } from '@codeware/shared/util/payload-types';
import { getActiveKeys } from '@codeware/shared/util/pure';

const env = getEnv();

/**
 * Define which blocks are available for the layout builder.
 */
// Using a record to make sure all blocks are included and not forgotten
const blocks: Record<BlockSlug, boolean> = {
  card: true,
  code: true,
  content: true,
  form: true,
  media: true,
  'social-media': true,
  spacing: true,
  'reusable-content': false
};

/**
 * Reusable content collection
 */
const reusableContent: CollectionConfig = {
  slug: 'reusable-content',
  access: {
    read: verifyApiKeyAccess({ secret: env.SIGNATURE_SECRET })
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
      localized: true,
      admin: {
        description: {
          en: 'What is the reusable content about?',
          sv: 'Vad handlar det återanvändbara elementet om?'
        }
      }
    },
    {
      name: 'layout',
      type: 'blocks',
      blockReferences: getActiveKeys<BlockSlug>(blocks),
      blocks: [],
      required: true
    }
  ]
};

export default reusableContent;
