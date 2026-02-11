import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@codeware/shared/ui/shadcn/components/alert';
import { InfoIcon, LucideAlertTriangle } from 'lucide-react';

import { Container } from '../layout/Container';

type Props = {
  children?: React.ReactNode;
  title?: string;
  severity: 'error' | 'info';
  stackTrace?: string;
  withoutContainer?: boolean;
};

export const ErrorContainer: React.FC<Props> = ({
  withoutContainer = false,
  ...props
}: Props) => {
  return (
    <>
      {(withoutContainer && <RenderAlert {...props} />) || (
        <Container className="mt-16 sm:mt-32">
          <RenderAlert {...props} />
        </Container>
      )}
    </>
  );
};

const RenderAlert: React.FC<Props> = ({
  children,
  title = 'Something went wrong!',
  severity,
  stackTrace
}) => {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Alert className="max-w-lg">
        {severity === 'error' && <LucideAlertTriangle />}
        {severity === 'info' && <InfoIcon />}
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>
          <div className="my-4">{children}</div>
          {stackTrace && (
            <div className="border-l-4 border-red-400 py-2 pl-2 font-mono text-xs dark:border-red-800">
              {stackTrace}
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};
