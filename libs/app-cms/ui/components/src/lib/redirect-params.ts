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

/**
 * Get the redirect params from the URL search params.
 *
 * Expecting search params pattern (decoded string):
 *
 * `redirect=?from=localhost:3000&email=vega@local.dev`
 *
 * @param params - The URL search params from `useSearchParams`.
 * @returns Original and redirect params or `null` if there are no redirect params.
 */
export const extractSearchParams = (params: ReadonlyURLSearchParams) => {
  const entries = Array.from(params.entries());
  if (!(entries.length === 1 && entries[0][0] === paramKey.redirect)) {
    return null;
  }

  const redirectParamsWithQuestionMark = entries[0][1];
  const urlToAnalyze = `http://anyurl.io${redirectParamsWithQuestionMark}`;

  // Create a new URL to extract the redirect params
  const url = new URL(urlToAnalyze);
  const searchEntries = Array.from(url.searchParams.entries());

  // Extract all search params
  const origin = searchEntries.reduce(
    (acc, [key, value]) => {
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  // Extract redirect params
  const redirect = searchEntries.reduce((acc, [key, value]) => {
    if (redirectParamKeys.includes(key)) {
      acc[key as keyof RedirectParams] = value;
    }
    return acc;
  }, {} as RedirectParams);

  return { origin, redirect };
};
