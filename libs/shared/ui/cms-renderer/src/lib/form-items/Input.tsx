import {
  FormControl,
  FormLabel
} from '@codeware/shared/ui/shadcn/components/form';
import { Input as BaseInput } from '@codeware/shared/ui/shadcn/components/input';
import type { HTMLInputTypeAttribute } from 'react';
import type { ControllerRenderProps, FieldValues } from 'react-hook-form';

type Props = ControllerRenderProps<FieldValues, string> & {
  label: string | null | undefined;
  placeholder: string | null | undefined;
  type: HTMLInputTypeAttribute;
  /** Native constraints, mirroring the react-hook-form rules */
  min?: number;
  max?: number;
};

export const Input: React.FC<Props> = ({
  label,
  type,
  placeholder,
  min,
  max,
  ...field
}) => {
  return (
    <>
      {/* `text-nowrap` keeps a label like "Number of travellers" on one line
          when its column has room to grow */}
      {label && <FormLabel className="text-nowrap">{label}</FormLabel>}
      <FormControl>
        <BaseInput
          type={type}
          placeholder={placeholder ?? ''}
          min={min}
          max={max}
          {...field}
        />
      </FormControl>
    </>
  );
};
