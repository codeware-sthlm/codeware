import { Button as BaseButton } from '@codeware/shared/ui/shadcn';
import { Loader2 } from 'lucide-react';

type Props = React.ComponentProps<typeof BaseButton> & {
  isLoading?: boolean;
};

export const Button: React.FC<Props> = ({ children, isLoading, ...props }) => {
  return (
    <BaseButton {...props} disabled={isLoading || props.disabled}>
      {isLoading && <Loader2 className="animate-spin" />}
      {children}
    </BaseButton>
  );
};
