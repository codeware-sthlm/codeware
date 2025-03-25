import {
  Textarea as BaseTextarea,
  FormControl,
  FormLabel
} from '@codeware/shared/ui/shadcn';
import type { FormFieldForBlockType } from '@codeware/shared/util/payload-types';
import type { ControllerRenderProps, FieldValues } from 'react-hook-form';

type Props = Pick<FormFieldForBlockType<'textarea'>, 'label'> & {
  placeholder: string | null | undefined;
} & ControllerRenderProps<FieldValues, string>;

export const Textarea: React.FC<Props> = ({ label, placeholder, ...field }) => {
  return (
    <>
      {label && <FormLabel>{label}</FormLabel>}
      <FormControl>
        <BaseTextarea
          placeholder={placeholder ?? ''}
          className="resize-none"
          {...field}
        />
      </FormControl>
    </>
  );
};
