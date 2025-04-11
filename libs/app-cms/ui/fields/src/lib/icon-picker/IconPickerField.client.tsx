'use client';

import {
  type HeroIcon,
  IconPicker
} from '@codeware/shared/ui/react-components';
import { FieldDescription, FieldLabel, useField } from '@payloadcms/ui';
import type { TextFieldClientProps } from 'payload';

export type IconPickerFieldProps = {
  /**
   * Hide the label of the field.
   *
   * Useful when the field should have a label but not be visible in the UI.
   */
  hideLabel?: boolean;
};

/**
 * Icon picker field component for client-side rendering.
 *
 * Displays a picker field with options for all available heroicons.
 * The selected icon is displayed next to the picker field.
 */
export const IconPickerField: React.FC<
  TextFieldClientProps & IconPickerFieldProps
> = ({ path, field, hideLabel }) => {
  const { value, setValue } = useField<HeroIcon>({ path });

  return (
    <div className="field-type text">
      {!hideLabel && <FieldLabel htmlFor={path} label={field.label} />}
      <IconPicker value={value} onChange={(icon) => setValue(icon)} />
      {field.admin?.description && (
        <FieldDescription
          path={path}
          marginPlacement="top"
          description={field.admin.description}
        />
      )}
    </div>
  );
};

export default IconPickerField;
