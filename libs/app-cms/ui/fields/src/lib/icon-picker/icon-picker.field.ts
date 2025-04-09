import type { TextField } from 'payload';

/**
 * Icon picker field configuration for Payload CMS.
 *
 * This field allows users to select an icon from a list of available heroicons.
 * The selected icon is displayed next to the picker field.
 */
export const iconPickerField: TextField = {
  name: 'icon',
  type: 'text',
  admin: {
    components: {
      Field: '@codeware/app-cms/ui/fields/icon-picker/IconPickerField.client'
    }
  }
};
