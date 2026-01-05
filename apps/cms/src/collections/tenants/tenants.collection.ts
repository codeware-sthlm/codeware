import type { CollectionConfig } from 'payload';

import { slugField } from '@codeware/app-cms/ui/fields';
import {
  authenticatedAccess,
  systemUserAccess
} from '@codeware/app-cms/util/access';
import { enumName } from '@codeware/app-cms/util/db';
import { adminGroups } from '@codeware/app-cms/util/definitions';

import { enforceApiKeyHook } from './hooks/enforce-api-key.hook';

/**
 * Tenants collection
 */
const tenants: CollectionConfig = {
  slug: 'tenants',
  auth: {
    useAPIKey: true,
    disableLocalStrategy: true
  },
  access: {
    create: systemUserAccess,
    delete: systemUserAccess,
    read: authenticatedAccess,
    update: systemUserAccess
  },
  hooks: {
    beforeChange: [enforceApiKeyHook]
  },
  admin: {
    group: adminGroups.settings,
    useAsTitle: 'name',
    description: {
      en: 'A workspace is like an organization or a company and is often called a "tenant". The content is scoped to the members of the workspace.',
      sv: 'En arbetsyta är som en organisation eller ett företag och kallas ofta för en "tenant". Innehållet begränsas till medlemmarna i arbetsytan.'
    }
  },
  labels: {
    singular: { en: 'Workspace', sv: 'Arbetsyta' },
    plural: { en: 'Workspaces', sv: 'Arbetsytor' }
  },
  fields: [
    // Customize the API key fields to be protected from being updated
    {
      name: 'enableAPIKey',
      type: 'checkbox',
      access: {
        update: () => false
      }
    },
    {
      name: 'apiKey',
      type: 'text',
      access: {
        update: () => false
      },
      admin: {
        disableListColumn: true
      }
    },
    {
      name: 'name',
      type: 'text',
      label: { en: 'Name', sv: 'Namn' },
      required: true
    },
    {
      name: 'description',
      type: 'textarea',
      label: { en: 'Description', sv: 'Beskrivning' }
    },
    {
      name: 'domains',
      type: 'array',
      index: true,
      label: { en: 'Domains', sv: 'Domäner' },
      fields: [
        {
          name: 'domain',
          type: 'text',
          label: { en: 'Domain', sv: 'Domän' },
          required: true
        },
        {
          name: 'pageTypes',
          type: 'select',
          label: { en: 'Page types', sv: 'Typ av sidor' },
          enumName: enumName('tenant_domain_page_type'),
          options: [
            { label: { en: 'CMS', sv: 'CMS' }, value: 'cms' },
            { label: { en: 'Web client', sv: 'Webbklient' }, value: 'client' },
            { label: { en: 'Disabled', sv: 'Inaktiverad' }, value: 'disabled' }
          ],
          hasMany: true,
          required: true
        }
      ],
      admin: {
        position: 'sidebar'
      }
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: { en: 'Members', sv: 'Medlemmar' },
          fields: [
            {
              name: 'relatedUsers',
              label: false,
              type: 'join',
              collection: 'users',
              on: 'tenants.tenant',
              admin: { disableListColumn: true }
            }
          ]
        },
        {
          label: { en: 'Pages', sv: 'Sidor' },
          fields: [
            {
              name: 'relatedPages',
              label: false,
              type: 'join',
              collection: 'pages',
              on: 'tenant',
              admin: { disableListColumn: true }
            }
          ]
        },
        {
          label: { en: 'Posts', sv: 'Inlägg' },
          fields: [
            {
              name: 'relatedPosts',
              label: false,
              type: 'join',
              collection: 'posts',
              on: 'tenant',
              admin: { disableListColumn: true }
            }
          ]
        },
        {
          label: { en: 'Categories', sv: 'Kategorier' },
          fields: [
            {
              name: 'relatedCategories',
              label: false,
              type: 'join',
              collection: 'categories',
              on: 'tenant',
              admin: { disableListColumn: true }
            }
          ]
        },
        {
          label: { en: 'Media', sv: 'Media' },
          fields: [
            {
              name: 'relatedMedia',
              label: false,
              type: 'join',
              collection: 'media',
              on: 'tenant',
              admin: { disableListColumn: true }
            }
          ]
        }
      ]
    },
    slugField({ sourceField: 'name' })
  ]
};

export default tenants;
