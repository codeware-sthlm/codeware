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
    formSubmissionOverrides: {
      hooks: {
        beforeValidate: [ensureTenant]
      }
    },
    redirectRelationships: ['pages']
  });
};
