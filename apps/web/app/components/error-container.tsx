import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@codeware/shared/ui/shadcn';
import { InfoIcon, LucideAlertTriangle } from 'lucide-react';

import { Container } from './container';

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
        {severity === 'error' && (
          <LucideAlertTriangle className="h-4 w-4 text-red-500" />
        )}
        {severity === 'info' && <InfoIcon className="h-4 w-4" />}
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>
          {children}
          {stackTrace && (
            <p className="text-muted-foreground border-l-2 py-2 text-sm">
              {stackTrace}
            </p>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};
