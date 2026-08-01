/**
 * HTTP status behind a rejected SDK call, however it chose to report it.
 *
 * `InfisicalSDKRequestError` carries no status field - the code only exists
 * inside the message, as `[StatusCode=404]`.
 */
export const statusOf = (error: unknown): number | undefined => {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const fromResponse = (error as { response?: { status?: number } }).response
    ?.status;

  if (fromResponse) {
    return fromResponse;
  }

  const message = String((error as { message?: unknown }).message ?? '');
  const matched = /\[StatusCode=(\d{3})\]/.exec(message);

  return matched ? Number(matched[1]) : undefined;
};

/** Whether a rejected SDK call means the secret simply is not there */
export const isNotFound = (error: unknown): boolean => statusOf(error) === 404;
