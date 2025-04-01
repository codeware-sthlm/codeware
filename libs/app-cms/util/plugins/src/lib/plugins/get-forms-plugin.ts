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
      state: false
    },
    formOverrides: {
      admin: {
        group: adminGroups['forms']
      }
    },
    formSubmissionOverrides: {
      admin: {
        group: adminGroups['forms']
      },
      hooks: {
        beforeValidate: [ensureTenant]
      }
    },
    redirectRelationships: ['pages']
  });
};
