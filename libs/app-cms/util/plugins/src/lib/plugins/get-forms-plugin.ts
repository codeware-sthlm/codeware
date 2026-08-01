import { adminGroups } from '@codeware/app-cms/util/definitions';
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder';
import type { Access } from 'payload';

import { customizedFields } from './forms/customized-fields';
import { ensureTenant } from './forms/ensure-tenant';
import { submissionCreateAccess } from './forms/submission-create-access';

type Options = {
  /**
   * Tenant scoped access controls for the collections this plugin adds.
   *
   * Owned by the app since the tenant scope is resolved from the runtime
   * environment.
   */
  access: {
    /** Client read access — admin users and tenant api keys */
    read: Access;
    /** Write access — admin users only */
    write: Access;
  };
};

export const getFormsPlugin = ({ access }: Options) => {
  return formBuilderPlugin({
    fields: {
      ...customizedFields,
      // Disable unsupported form fields
      payment: false,
      state: false,
      upload: false
    },
    formOverrides: {
      // The plugin default is `read: () => true`, leaving every tenant's forms
      // world readable
      access: {
        read: access.read,
        create: access.write,
        update: access.write,
        delete: access.write
      },
      admin: {
        group: adminGroups['forms'],
        description: {
          en: 'Build contact and signup forms to place on your pages.',
          sv: 'Bygg kontakt- och anmälningsformulär att placera på dina sidor.'
        }
      }
    },
    formSubmissionOverrides: {
      // The plugin defaults leave submissions readable by any authenticated
      // identity and deletable by the Payload default, neither of which scopes
      // an api key to its own tenant. Update stays disabled by the plugin.
      access: {
        create: submissionCreateAccess,
        read: access.read,
        delete: access.write
      },
      admin: {
        group: adminGroups['forms'],
        description: {
          en: 'Messages visitors have sent through the forms on your website.',
          sv: 'Meddelanden som besökare har skickat via formulären på din webbplats.'
        }
      },
      hooks: {
        beforeValidate: [ensureTenant]
      }
    },
    redirectRelationships: ['pages']
  });
};
