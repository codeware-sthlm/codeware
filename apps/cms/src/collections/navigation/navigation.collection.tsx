import type { CollectionConfig, Condition } from 'payload';

import { systemUserOrTenantAdminAccess } from '@codeware/app-cms/util/access';
import { enumName } from '@codeware/app-cms/util/db';
import { adminGroups } from '@codeware/app-cms/util/definitions';
import type { Navigation } from '@codeware/shared/util/payload-types';

import { userOrApiKeyAccess } from '../../security/user-or-api-key-access';

/**
 * Whether a custom label source is selected.
 */
const isCustomLabelSource: Condition<
  Navigation,
  NonNullable<Navigation['items']>[number]
> = (_, siblingData) => siblingData.labelSource === 'custom';

/**
 * Navigation collection.
 */
const navigation: CollectionConfig = {
  slug: 'navigation',
  admin: {
    group: adminGroups.settings
  },
  access: {
    read: userOrApiKeyAccess(),
    update: systemUserOrTenantAdminAccess
  },
  labels: {
    singular: { en: 'Navigation', sv: 'Navigation' },
    plural: { en: 'Navigation', sv: 'Navigation' }
  },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: { en: 'Navigation Tree', sv: 'Navigationsträd' },
      fields: [
        {
          name: 'reference',
          type: 'relationship',
          label: {
            en: 'Navigate to document',
            sv: 'Navigera till dokument'
          },
          relationTo: ['pages', 'posts'],
          required: true
        },
        {
          name: 'labelSource',
          type: 'radio',
          label: false,
          admin: {
            layout: 'horizontal'
          },
          enumName: enumName('navigation_label_source'),
          defaultValue: 'document',
          options: [
            {
              label: {
                en: 'Use document name as link label',
                sv: 'Använd dokumentets namn som länktext'
              },
              value: 'document'
            },
            {
              label: { en: 'Custom link label', sv: 'Anpassad länktext' },
              value: 'custom'
            }
          ]
        },
        {
          name: 'customLabel',
          type: 'text',
          label: { en: 'Link label', sv: 'Länktext' },
          admin: {
            condition: isCustomLabelSource
          },
          required: true
        }
      ],
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@codeware/apps/cms/components/NavigationArrayRowLabel'
        }
      }
    }
  ]
};

export default navigation;
