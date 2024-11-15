import { CollectionConfig } from 'payload/types';

const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    useAPIKey: true
  },
  admin: { useAsTitle: 'name' },
  labels: {
    singular: { en: 'User', sv: 'Användare' },
    plural: { en: 'Users', sv: 'Användare' }
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
        { label: { en: 'Admin', sv: 'Administratör' }, value: 'admin' },
        { label: { en: 'User', sv: 'Användare' }, value: 'user' }
      ],
      required: true,
      defaultValue: 'user'
    }
  ]
};

export default Users;
