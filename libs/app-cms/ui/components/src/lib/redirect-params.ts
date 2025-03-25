import { ReadonlyURLSearchParams } from 'next/navigation';

export const paramKey = {
  from: 'from',
  email: 'email',
  // Added by Next.js
  redirect: 'redirect'
} as const;

const redirectParamKeys = Object.keys(paramKey).filter(
  (key) => key !== paramKey.redirect
);
type RedirectParams = Record<
  Exclude<(typeof paramKey)[keyof typeof paramKey], 'redirect'>,
  string
>;

type Result = {
  /**
   * Whether the redirect comes from a restricted tenant domain.
   *
   * When this is `true`, the expected params and values exists in `redirectExpected`.
   */
  isTenantDomainRedirect: boolean;

  /**
   * Extracted redirect search params.
   */
  redirectParams: Record<string, string>;

  /**
   * The expected redirect params from `redirectParams`
   * to identify the redirect related to a restricted tenant domain.
   */
  redirectExpected: RedirectParams;
};

/**
 * Get the redirect params from the URL search params
 * with an indicator whether this comes from a restricted tenant domain redirect.
 *
 * Expecting search params pattern (decoded string):
 *
 * `redirect=?from=localhost:3000&email=vega@local.dev`
 *
 * @param params - The URL search params from `useSearchParams`.
 * @returns Extracted query params result.
 */
export const extractSearchParams = (
  params: ReadonlyURLSearchParams
): Result => {
  const entries = Array.from(params.entries());
  if (!(entries.length === 1 && entries[0][0] === paramKey.redirect)) {
    return {
      isTenantDomainRedirect: false,
      redirectParams: {},
      redirectExpected: {} as RedirectParams
    };
  }

  const redirectParamsWithQuestionMark = entries[0][1];
  const urlToAnalyze = `http://anyurl.io${redirectParamsWithQuestionMark}`;

  // Create a new URL to extract the redirect params
  const url = new URL(urlToAnalyze);
  const searchEntries = Array.from(url.searchParams.entries());

  // Extract all search params
  const redirectParams = searchEntries.reduce(
    (acc, [key, value]) => {
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  // Extract redirect params
  const redirectExpected = searchEntries.reduce((acc, [key, value]) => {
    if (redirectParamKeys.includes(key)) {
      acc[key as keyof RedirectParams] = value;
    }
    return acc;
  }, {} as RedirectParams);

  const isTenantDomainRedirect =
    Object.keys(redirectExpected).length === redirectParamKeys.length &&
    Object.values(redirectExpected).every((value) => value && value !== '');

  return { isTenantDomainRedirect, redirectParams, redirectExpected };
};
