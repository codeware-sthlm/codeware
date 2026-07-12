import type { CollectionConfig } from 'payload';

import {
  authenticatedAccess,
  systemUserAccess
} from '@codeware/app-cms/util/access';
import { adminGroups } from '@codeware/app-cms/util/definitions';
import { hasRole } from '@codeware/app-cms/util/misc';

/**
 * FAQ collection
 *
 * Global help content (not tenant-scoped) rendered in the admin help drawer.
 * Managed by system users only but readable by all authenticated users.
 */
const faq: CollectionConfig = {
  slug: 'faq',
  admin: {
    group: adminGroups.settings,
    defaultColumns: ['question'],
    useAsTitle: 'question',
    // Users consume FAQ content via the help drawer only
    hidden: ({ user }) => !hasRole(user, 'system-user'),
    description: {
      en: 'Questions and answers shown to all users in the admin help drawer.',
      sv: 'Frågor och svar som visas för alla användare i hjälppanelen.'
    }
  },
  orderable: true,
  access: {
    read: authenticatedAccess,
    create: systemUserAccess,
    update: systemUserAccess,
    delete: systemUserAccess
  },
  labels: {
    singular: { en: 'FAQ', sv: 'Vanlig fråga' },
    plural: { en: 'FAQ', sv: 'Vanliga frågor' }
  },
  fields: [
    {
      name: 'question',
      type: 'text',
      label: { en: 'Question', sv: 'Fråga' },
      localized: true,
      required: true
    },
    {
      name: 'answer',
      type: 'textarea',
      label: { en: 'Answer', sv: 'Svar' },
      admin: {
        description: {
          en: 'Plain text; line breaks are preserved.',
          sv: 'Vanlig text; radbrytningar bevaras.'
        }
      },
      localized: true,
      required: true
    }
  ]
};

export default faq;
