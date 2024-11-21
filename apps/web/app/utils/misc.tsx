/**
 * Get the error message from an error object.
 *
 * @param error The error object
 *
 * @returns The error message or 'Unknown Error' if the error message cannot be found
 *
 * @link https://github.com/epicweb-dev/epic-stack/blob/main/app/components/error-boundary.tsx#L15
 */
export function getErrorMessage(error: unknown) {
  if (typeof error === 'string') {
    return error;
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  console.error('Unable to get error message for error', error);

  return 'Unknown Error';
}
