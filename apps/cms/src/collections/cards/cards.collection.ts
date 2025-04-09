import type { CollectionConfig } from 'payload';

import { getEnv } from '@codeware/app-cms/feature/env-loader';
import { cardGroupField, slugField } from '@codeware/app-cms/ui/fields';
import { verifyApiKeyAccess } from '@codeware/app-cms/util/access';
import { adminGroups } from '@codeware/app-cms/util/definitions';

const env = getEnv();

/**
 * Cards collection where one or many reusable cards can be created
 */
const cards: CollectionConfig = {
  slug: 'cards',
  admin: {
    group: adminGroups.content,
    description: {
      en: 'Create reusable cards',
      sv: 'Skapa återanvändbara kort'
    },
    defaultColumns: ['title', 'slug', 'tenant'],
    useAsTitle: 'title'
  },
  access: {
    read: verifyApiKeyAccess({ secret: env.SIGNATURE_SECRET })
  },
  labels: {
    singular: { en: 'Card', sv: 'Kort' },
    plural: { en: 'Cards', sv: 'Kort' }
  },
  fields: [...cardGroupField.fields, slugField({ sourceField: 'title' })]
};

export default cards;
