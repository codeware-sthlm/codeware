import { adminGroups } from '@codeware/app-cms/util/definitions';
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder';

import { customizedFields } from './forms/customized-fields';
import { ensureTenant } from './forms/ensure-tenant';

export const getFormsPlugin = () => {
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
