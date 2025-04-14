import {
  FormControl,
  FormItem,
  FormLabel
} from '@codeware/shared/ui/shadcn/components/form';
import {
  RadioGroup,
  RadioGroupItem
} from '@codeware/shared/ui/shadcn/components/radio-group';
import type { FormFieldForBlockType } from '@codeware/shared/util/payload-types';
import type { ControllerRenderProps, FieldValues } from 'react-hook-form';

type Props = Pick<FormFieldForBlockType<'radio'>, 'label' | 'options'> &
  ControllerRenderProps<FieldValues, string>;

export const Radio: React.FC<Props> = ({
  label,
  options,
  onChange,
  ...props
}) => {
  return (
    <>
      {label && <FormLabel>{label}</FormLabel>}
      <FormControl>
        <RadioGroup
          onValueChange={onChange}
          className="flex flex-col space-y-1"
          {...props}
        >
          {(options ?? []).map(({ label: optionLabel, value: optionValue }) => {
            return (
              <FormItem
                key={optionValue}
                className="flex items-center space-y-0 space-x-3"
              >
                <FormControl>
                  <RadioGroupItem value={optionValue} />
                </FormControl>
                <FormLabel className="font-normal">{optionLabel}</FormLabel>
              </FormItem>
            );
          })}
        </RadioGroup>
      </FormControl>
    </>
  );
};
