import type { CollectionConfig } from 'payload';

import { getEnv } from '@codeware/app-cms/feature/env-loader';
import { verifyApiKeyAccess } from '@codeware/app-cms/util/access';
import { adminGroups } from '@codeware/app-cms/util/definitions';

const env = getEnv();

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
      blockReferences: ['card', 'code', 'content', 'form', 'media'],
      blocks: [],
      required: true
    }
  ]
};

export default reusableContent;
