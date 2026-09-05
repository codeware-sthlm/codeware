import { hasRole } from '@codeware/app-cms/util/misc';
import { BUILT_IN_TOKENS, themeLabel } from '@codeware/shared/theme';
import {
  type ThemeTokens,
  brokenReferences,
  buildThemeTokens,
  checkContrast,
  parseThemeTokens
} from '@codeware/shared/util/color';
import type { AdminViewServerProps } from 'payload';
import React from 'react';

import { type BuiltInTheme, ThemeLibrary } from './ThemeLibrary.client';

/**
 * What the studio is handed when a built-in is opened.
 *
 * Two things happen here, and both have to happen in one place or the card and
 * the studio disagree about the theme.
 *
 * A theme's own declarations are folded in with what the recipe cannot say.
 * `parseTheme` keeps them apart because writing a committed file back wants
 * them apart; nothing else does. A saved theme is reopened from its recipe and
 * its overrides, so a declaration travelling any other way is lost the moment
 * the fork is closed — and `codeware`'s `--core-surface-invert` then points at
 * an `--eerie-black` that no longer exists.
 *
 * A value the parser could not carry is dropped rather than copied. It would
 * resolve to nothing in a runtime theme, and the collection refuses a dangling
 * alias outright — so keeping it turns a fork into a save that fails, naming a
 * token the author never wrote. Falling back to the recipe is what the card
 * promises, and this is where that promise is kept.
 */
const editableTokens = ({
  overrides,
  passthrough,
  unresolved
}: ReturnType<typeof parseThemeTokens>) => {
  const carried = (tokens: ThemeTokens, scheme: 'light' | 'dark') =>
    Object.fromEntries(
      Object.entries(tokens).filter(
        ([token]) =>
          !unresolved.some(
            (entry) => entry.scheme === scheme && entry.token === token
          )
      )
    );

  return {
    light: carried({ ...passthrough.light, ...overrides.light }, 'light'),
    dark: carried({ ...passthrough.dark, ...overrides.dark }, 'dark')
  };
};

/**
 * Fitted once per process, not per render.
 *
 * The tokens are generated at build time and never change while the server is
 * up, so the search behind every recipe is pure waste on the second visit.
 */
let fitted: Array<BuiltInTheme> | null = null;

const builtInThemes = (): Array<BuiltInTheme> =>
  (fitted ??= Object.entries(BUILT_IN_TOKENS).map(([name, tokens]) => {
    const parsed = parseThemeTokens(tokens);
    const { recipe, overrides, passthrough, unresolved } = parsed;

    const editable = editableTokens(parsed);
    const { light, dark } = buildThemeTokens(recipe, editable);
    // Dark holds only what changes, so it is judged as the browser cascades it
    const darkAsSeen = { ...light, ...dark };

    return {
      name,
      label: themeLabel(name),
      recipe,
      overrides: editable,
      // Built rather than read off the overrides: a theme whose primary follows
      // its recipe has no override to read, and the swatch would come out blank
      // on exactly the themes that are most faithful to it
      primary: light['--primary'],
      counts: {
        fineTuned:
          Object.keys(overrides.light).length +
          Object.keys(overrides.dark).length,
        // Says how faithfully the theme was read, which is worth knowing
        // before editing it
        extra:
          Object.keys(passthrough.light).length +
          Object.keys(passthrough.dark).length,
        notPortable: unresolved.length,
        // Counted the way the studio counts it — a failing pair is one issue,
        // not two — so the card and the header it opens agree
        issues:
          checkContrast(light).filter(({ passes }) => !passes).length +
          checkContrast(darkAsSeen).filter(({ passes }) => !passes).length +
          brokenReferences(light).length +
          brokenReferences(darkAsSeen).length
      }
    };
  }));

/**
 * The built-in themes, opened in the studio.
 *
 * A view rather than a field on a collection, because a platform theme has no
 * row to hang one off — it is CSS in the bundle. Fitting a recipe to it is what
 * gives the studio something to open, and forking is what turns the result into
 * a row that does exist.
 *
 * Parsed here rather than in the browser: it is the same answer for everyone,
 * costs a few milliseconds, and keeps the fitting off the client bundle.
 */
const ThemeLibraryView: React.FC<AdminViewServerProps> = ({
  initPageResult
}) => {
  // From the request, not from the `user` prop. A view mounted on its own path
  // is not handed the populated `user` that a view *override* gets — it reads
  // as signed out, and the gate below then refuses a system admin.
  const user = initPageResult?.req?.user ?? null;

  // Editing a platform theme changes every tenant's site, so the gate is the
  // same one the file export sits behind
  if (!hasRole(user, 'system-user')) {
    return (
      <div className="twp p-8">
        <h1 className="text-lg font-semibold">Theme library</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Platform themes are managed by system administrators.
        </p>
      </div>
    );
  }

  return <ThemeLibrary themes={builtInThemes()} />;
};

export default ThemeLibraryView;
