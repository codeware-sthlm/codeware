import { Separator } from '@codeware/shared/ui/shadcn/components/separator';
import {
  type ErrorResponse,
  isRouteErrorResponse,
  useParams,
  useRouteError
} from '@remix-run/react';
import * as React from 'react';

// TODO Use Sentry for error tracking - COD-202
// import { captureRemixErrorBoundaryError } from '@sentry/remix'
import { getErrorMessage } from '../utils/misc';

import { ErrorContainer } from './error-container';

type StatusHandler = (info: {
  error: ErrorResponse;
  params: Record<string, string | undefined>;
}) => React.JSX.Element | null;

export function GeneralErrorBoundary({
  defaultStatusHandler = ({ error }) => (
    <p>
      {error.status} {error.data}
    </p>
  ),
  statusHandlers,
  unexpectedErrorHandler = (error) => <p>{getErrorMessage(error)}</p>
}: {
  defaultStatusHandler?: StatusHandler;
  statusHandlers?: Record<number, StatusHandler>;
  unexpectedErrorHandler?: (error: unknown) => React.JSX.Element | null;
}) {
  const error = useRouteError();
  // captureRemixErrorBoundaryError(error)
  const params = useParams();

  if (typeof document !== 'undefined') {
    console.error(error);
  }

  return (
    <ErrorContainer severity="error">
      <p>Please contact the administrator if the problem persists.</p>
      <Separator className="my-4" />
      {isRouteErrorResponse(error)
        ? (statusHandlers?.[error.status] ?? defaultStatusHandler)({
            error,
            params
          })
        : unexpectedErrorHandler(error)}
    </ErrorContainer>
  );
}
