import {
  Input as BaseInput,
  FormControl,
  FormLabel
} from '@codeware/shared/ui/shadcn';
import type { HTMLInputTypeAttribute } from 'react';
import type { ControllerRenderProps, FieldValues } from 'react-hook-form';

type Props = ControllerRenderProps<FieldValues, string> & {
  label: string | null | undefined;
  placeholder: string | null | undefined;
  type: HTMLInputTypeAttribute;
};

export const Input: React.FC<Props> = ({
  label,
  type,
  placeholder,
  ...field
}) => {
  return (
    <>
      {label && <FormLabel>{label}</FormLabel>}
      <FormControl>
        <BaseInput type={type} placeholder={placeholder ?? ''} {...field} />
      </FormControl>
    </>
  );
};
