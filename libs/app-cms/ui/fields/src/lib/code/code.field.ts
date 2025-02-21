import { CodeField } from 'payload';

export const codeField: CodeField = {
  name: 'code',
  type: 'code',
  admin: {
    components: {
      Field: '@codeware/app-cms/ui/fields/code/Code.client'
    }
  }
};
