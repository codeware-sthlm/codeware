import { deepMerge } from '@codeware/shared/util/pure';
import type { TextField } from 'payload';

import type { ColorPickerFieldProps } from './ColorPickerField.client';

type Props = {
  /** Custom field component properties */
  props?: ColorPickerFieldProps;

  /** Override field configuration with selected properties */
  override?: Partial<TextField>;
};

/**
 * Color picker field configuration for Payload CMS.
 *
 * This field allows users to select a color from Tailwind CSS colors.
 * The selected color is displayed next to the picker field.
 *
 * The field configuration can be overridden by providing a partial configuration,
 * that will be deep merged with the default configuration.
 *
 * Applied optional properties:
 *  - `label`
 */
export const colorPickerField = ({
  props,
  override
}: Props = {}): TextField => {
  const field = deepMerge<TextField>(
    {
      name: 'color',
      type: 'text',
      label: { en: 'Color', sv: 'Färg' },
      admin: {
        components: {
          Field: {
            path: '@codeware/app-cms/ui/fields/color-picker/ColorPickerField.client',
            clientProps: props
          }
        }
      }
    },
    override ?? {}
  );

  return field;
};
