'use client';

import {
  ColorPicker,
  type ColorPickerColor
} from '@codeware/shared/ui/react-components';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@codeware/shared/ui/shadcn/components/tooltip';
import { FieldDescription, FieldLabel, useField } from '@payloadcms/ui';
import { XIcon } from 'lucide-react';
import type { TextFieldClientProps } from 'payload';

import type { ColorPickerFieldProps } from './color-picker.field';

/**
 * Color picker field component for client-side rendering.
 *
 * Displays a picker field with options for all available colors.
 * The selected color is displayed next to the picker field.
 */
export const ColorPickerField: React.FC<
  TextFieldClientProps & ColorPickerFieldProps
> = ({ path, field, hideLabel }) => {
  const { value, setValue } = useField<ColorPickerColor | null>({ path });

  return (
    <div className="twp field-type text">
      {!hideLabel && <FieldLabel htmlFor={path} label={field.label} />}
      <div className="flex flex-row items-center gap-2">
        <ColorPicker value={value} onChange={(color) => setValue(color)} />
        {value && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <XIcon
                  className="size-4 hover:cursor-pointer"
                  onClick={() => setValue(null)}
                />
              </TooltipTrigger>
              <TooltipContent>
                {/* TODO: Language support */}
                <p>Clear selected color</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
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

export default ColorPickerField;
