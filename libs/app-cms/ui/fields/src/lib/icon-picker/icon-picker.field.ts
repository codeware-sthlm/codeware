import { deepMerge } from '@codeware/shared/util/pure';
import type { TextField } from 'payload';

export type IconPickerFieldProps = {
  /**
   * Hide the label of the field.
   *
   * Useful when the field should have a label but not be visible in the UI.
   */
  hideLabel?: boolean;
};

type Props = {
  /** Custom field component properties */
  props?: IconPickerFieldProps;

  /** Override field configuration with selected properties */
  override?: Partial<TextField>;
};

/**
 * Icon picker field configuration for Payload CMS.
 *
 * This field allows users to select an icon from a list of available heroicons.
 * The selected icon is displayed next to the picker field.
 *
 * The field configuration can be overridden by providing a partial configuration,
 * that will be deep merged with the default configuration.
 *
 * Applied optional properties:
 *  - `label`
 */
export const iconPickerField = ({ props, override }: Props = {}): TextField => {
  const field = deepMerge<TextField>(
    {
      name: 'icon',
      type: 'text',
      label: {
        en: 'Icon',
        sv: 'Ikon'
      },
      admin: {
        components: {
          Field: {
            path: '@codeware/app-cms/ui/fields/icon-picker/IconPickerField.client',
            clientProps: props
          }
        }
      }
    },
    override ?? {}
  );

  return field;
};
