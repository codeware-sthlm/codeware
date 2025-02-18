import { CollectionConfig } from 'payload';

import { canCreateUsers } from './access/can-create-users';
import { canDeleteUsers } from './access/can-delete-users';
import { canReadUsers } from './access/can-read-users';
import { canUpdateUsers } from './access/can-update-users';
import { hideUsersCollection } from './admin/hide-users-collection';
import { showRoleField } from './conditions/show-role-field';
import { showTenantsField } from './conditions/show-tenants-field';

/**
 * Users collection
 */
const users: CollectionConfig = {
  slug: 'users',
  auth: { maxLoginAttempts: 5, lockTime: 1000 * 60 * 60 * 24 },
  admin: {
    useAsTitle: 'name',
    hidden: hideUsersCollection
  },
  labels: {
    singular: { en: 'User', sv: 'Användare' },
    plural: { en: 'Users', sv: 'Användare' }
  },
  access: {
    create: canCreateUsers,
    delete: canDeleteUsers,
    read: canReadUsers,
    update: canUpdateUsers
  },
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
      options: [
        { label: { en: 'User', sv: 'Användare' }, value: 'user' },
        {
          label: { en: 'System User', sv: 'Systemanvändare' },
          value: 'system-user'
        }
      ],
      admin: {
        description: {
          en: 'System users can access and manage the whole system.',
          sv: 'Systemanvändare kan komma åt och hantera hela systemet.'
        },
        condition: showRoleField
      },
      required: true,
      defaultValue: 'user'
    },
    {
      name: 'tenants',
      type: 'array',
      label: { en: 'Workspaces', sv: 'Arbetsytor' },
      fields: [
        {
          name: 'tenant',
          type: 'relationship',
          relationTo: 'tenants',
          index: true,
          required: true,
          saveToJWT: true
        },
        {
          name: 'role',
          type: 'select',
          label: { en: 'Role', sv: 'Roll' },
          options: [
            { label: { en: 'User', sv: 'Användare' }, value: 'user' },
            { label: { en: 'Admin', sv: 'Administratör' }, value: 'admin' }
          ],
          admin: {
            description: {
              en: 'The role of the user in the workspace.',
              sv: 'Rollen som användaren ska ha i arbetsytan.'
            }
          },
          required: true,
          defaultValue: 'user'
        }
      ],
      admin: {
        description: {
          en: 'Users can be limited to one or many workspaces.',
          sv: 'Användare kan begränsas till en eller flera arbetsytor.'
        },
        condition: showTenantsField
      },
      saveToJWT: true
    },
    {
      name: 'description',
      type: 'textarea',
      label: { en: 'Description', sv: 'Beskrivning' },
      admin: {
        description: {
          en: 'Short description of the user',
          sv: 'Kort beskrivning av användaren'
        },
        position: 'sidebar'
      },
      maxLength: 200
    }
  ]
};

export default users;
