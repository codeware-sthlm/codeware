import { CollectionConfig } from 'payload';

import {
  systemUserAccess,
  systemUserOrTenantAdminAccess
} from '@codeware/app-cms/util/access';
import { adminGroups } from '@codeware/app-cms/util/definitions';

import { adminAccessToAllDocTenants } from './access/admin-access-to-all-doc-tenants';
import { tenantsArrayField } from './fields/tenants-array.field';
import { ensureTenantHook } from './hooks/ensure-tenant.hook';

/**
 * Users collection
 */
const users: CollectionConfig<'users'> = {
  slug: 'users',
  auth: { maxLoginAttempts: 5, lockTime: 1000 * 60 * 60 * 24 },
  admin: {
    group: adminGroups.settings,
    useAsTitle: 'name'
  },
  labels: {
    singular: { en: 'User', sv: 'Användare' },
    plural: { en: 'Users', sv: 'Användare' }
  },
  access: {
    create: systemUserOrTenantAdminAccess,
    update: adminAccessToAllDocTenants('allowSelf'),
    delete: adminAccessToAllDocTenants('denySelf')
  },
  hooks: {
    beforeValidate: [ensureTenantHook]
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: { en: 'User', sv: 'Användare' },
          fields: [
            {
              name: 'name',
              type: 'text',
              label: { en: 'Name', sv: 'Namn' },
              required: true
            },
            {
              name: 'role',
              type: 'select',
              label: { en: 'Role', sv: 'Roll' },
              access: {
                // For others than system users the field is read-only with default value
                create: systemUserAccess,
                update: systemUserAccess
              },
              options: [
                { label: { en: 'User', sv: 'Användare' }, value: 'user' },
                {
                  label: { en: 'System User', sv: 'Systemanvändare' },
                  value: 'system-user'
                }
              ],
              admin: {
                description: {
                  en: 'System users have access to manage the whole system and do not need to be members of a workspace. For normal users, it is a requirement to be members of a workspace.',
                  sv: 'Systemanvändare har behörighet att hantera hela systemet och behöver därför inte vara medlemmar i en arbetsyta. För normala användare är det ett krav att vara medlemmar i en arbetsyta.'
                }
              },
              required: true,
              defaultValue: 'user'
            }
          ]
        },
        {
          label: { en: 'Workspaces', sv: 'Arbetsytor' },
          fields: [tenantsArrayField()]
        }
      ]
    },
    {
      name: 'description',
      type: 'textarea',
      label: { en: 'Description', sv: 'Beskrivning' },
      admin: {
        description: {
          en: 'Short description of the user.',
          sv: 'Kort beskrivning av användaren.'
        },
        position: 'sidebar'
      },
      maxLength: 200
    }
  ]
};

export default users;
