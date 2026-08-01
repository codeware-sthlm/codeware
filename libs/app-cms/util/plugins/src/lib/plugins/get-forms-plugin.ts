import { adminGroups } from '@codeware/app-cms/util/definitions';
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder';
import type { Access } from 'payload';

import { customizedFields } from './forms/customized-fields';
import { ensureTenant } from './forms/ensure-tenant';
import { submissionCreateAccess } from './forms/submission-create-access';

type Options = {
  /**
   * Tenant scoped access control applied to form submissions.
   *
   * Owned by the app since the tenant scope is resolved from the runtime
   * environment.
   */
  submissionAccess: Access;
};

export const getFormsPlugin = ({ submissionAccess }: Options) => {
  return formBuilderPlugin({
    fields: {
      ...customizedFields,
      // Disable unsupported form fields
      payment: false,
      state: false,
      upload: false
    },
    formOverrides: {
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
        read: submissionAccess,
        delete: submissionAccess
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
