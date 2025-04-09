import {
  FormControl,
  FormLabel
} from '@codeware/shared/ui/shadcn/components/form';
import {
  Select as BaseSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@codeware/shared/ui/shadcn/components/select';
import type { ControllerRenderProps, FieldValues } from 'react-hook-form';

type Option = {
  label: string;
  value: string;
};

type Props = {
  label: string | null | undefined;
  options: Array<Option>;
  placeholder: string | null | undefined;
} & ControllerRenderProps<FieldValues, string>;

export const Select: React.FC<Props> = ({
  label,
  options,
  placeholder,
  onChange,
  ...props
}) => {
  return (
    <>
      {label && <FormLabel>{label}</FormLabel>}
      <BaseSelect onValueChange={onChange} {...props}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {(options ?? []).map(({ label: optionLabel, value: optionValue }) => {
            return (
              <SelectItem key={optionValue} value={optionValue}>
                {optionLabel}
              </SelectItem>
            );
          })}
        </SelectContent>
      </BaseSelect>
    </>
  );
};
