import { RequestError } from '@octokit/request-error';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

/**
 * Generic wrapper for Octokit calls.
 *
 * Operations that fail will throw an error indicating the issue.
 * But for requests that may not return an entity, like `get` requests,
 * can instead return `null` by setting `'not-found-returns-null'` option.
 *
 * @param operation Operation to perform
 * @returns Result of the operation
 * @throws If operation fails
 */
export async function withGitHub<T>(operation: () => Promise<T>): Promise<T>;
/**
 * Generic wrapper for Octokit calls.
 *
 * @param operation Operation to perform
 * @param option Request error handling option
 * @returns Result of the operation or `null` if a requested entity was not found
 */
export async function withGitHub<T>(
  operation: () => Promise<T>,
  option: 'not-found-returns-null'
): Promise<T | null>;
export async function withGitHub<T>(
  operation: () => Promise<T>,
  option?: 'not-found-returns-null'
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof RequestError) {
      switch (error.status) {
        case StatusCodes.UNAUTHORIZED:
          throw new Error(
            `Authentication failed. Please check your GitHub token.\n${error.message}`
          );

        case StatusCodes.FORBIDDEN:
          throw new Error(
            `Permission to the operation was denied. Please check your GitHub token.\n${error.message}`
          );

        case StatusCodes.NOT_FOUND:
          if (option === 'not-found-returns-null') {
            return null;
          }
          throw new Error(
            `Requested information was not found.\n${error.message}`
          );

        default:
          throw new Error(
            `Request failed with ${error.status} - ${getReasonPhrase(error.status)}.\n${error.message}`
          );
      }
    }

    // For unknown errors, preserve stack trace
    throw error;
  }
}
