import type {
  BrokenReference,
  ContrastResult
} from '@codeware/shared/util/color';

/** What is wrong with a token, keyed by token name. */
export type SchemeIssues = Record<string, Array<string>>;

/**
 * Turn the two reports into a per-token list of what to fix.
 *
 * The contrast report and the dangling-alias list both say what is wrong with
 * the theme as a whole; neither says which of ninety rows to go and edit. This
 * inverts them onto the tokens themselves.
 *
 * A failing pair marks **both** of its tokens. Either one can be the fix —
 * darkening the text or lightening the surface — and nothing here can know
 * which the author meant.
 *
 * @param contrast - Every checked pair, passing ones included
 * @param broken - Aliases that lead nowhere, for this scheme
 * @returns Issue descriptions by token, in the order they were found
 */
export function tokenIssues(
  contrast: ReadonlyArray<ContrastResult>,
  broken: ReadonlyArray<BrokenReference>
): SchemeIssues {
  const issues: SchemeIssues = {};

  const add = (token: string, issue: string) => {
    issues[token] = [...(issues[token] ?? []), issue];
  };

  for (const result of contrast) {
    if (result.passes) {
      continue;
    }

    const issue = `${result.usage}: ${result.ratio.toFixed(2)}:1, needs ${result.minimum}:1`;
    add(result.foreground, issue);
    add(result.background, issue);
  }

  for (const { token, reference, reason } of broken) {
    add(
      token,
      reason === 'cycle'
        ? `${reference} refers back to itself`
        : `${reference} is not defined`
    );
  }

  return issues;
}
