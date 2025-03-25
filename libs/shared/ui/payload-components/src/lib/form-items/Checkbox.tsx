import {
  Checkbox as BaseCheckbox,
  FormControl,
  FormLabel
} from '@codeware/shared/ui/shadcn';
import type { FormFieldForBlockType } from '@codeware/shared/util/payload-types';
import type { ControllerRenderProps, FieldValues } from 'react-hook-form';

type Props = Pick<FormFieldForBlockType<'checkbox'>, 'label'> &
  ControllerRenderProps<FieldValues, string>;

export const Checkbox: React.FC<Props> = ({
  label,
  value,
  onChange,
  ...field
}) => {
  return (
    <div className="flex flex-row items-start space-x-3">
      <FormControl>
        <BaseCheckbox checked={value} onCheckedChange={onChange} {...field} />
      </FormControl>
      <FormLabel>{label}</FormLabel>
    </div>
  );
};
