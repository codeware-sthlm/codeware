import { Separator } from '@codeware/shared/ui/shadcn/components/separator';
import { t } from '@codeware/shared/util/i18n';
import {
  type ErrorResponse,
  isRouteErrorResponse,
  useParams,
  useRouteError,
  useRouteLoaderData
} from '@remix-run/react';
import * as React from 'react';

// TODO Use Sentry for error tracking - COD-202
// import { captureRemixErrorBoundaryError } from '@sentry/remix'
import type { loader as rootLoader } from '../root';
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
  const rootData = useRouteLoaderData<typeof rootLoader>('root');
  const locale = rootData?.requestInfo.userPrefs.locale ?? 'en';

  if (typeof document !== 'undefined') {
    console.error(error);
  }

  return (
    <ErrorContainer locale={locale} severity="error">
      <p>{t(locale, 'error.contactAdmin')}</p>
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
