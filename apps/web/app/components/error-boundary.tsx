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
    <div className="container flex items-center justify-center p-20 text-h2">
      {isRouteErrorResponse(error)
        ? (statusHandlers?.[error.status] ?? defaultStatusHandler)({
            error,
            params
          })
        : unexpectedErrorHandler(error)}
    </div>
  );
}
