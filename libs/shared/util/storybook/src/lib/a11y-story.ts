/**
 * Storybook a11y helpers — for use in *.stories.tsx files only.
 *
 * Each call to `a11yStory` produces one story object with:
 *   - the chosen theme × mode combination set as globals
 *   - `parameters.a11y.test: 'error'` so axe violations fail the vitest run
 *
 * Use explicit `export const` declarations so the Storybook CSF parser can
 * statically discover each story (destructuring exports are not detected):
 *
 * ```ts
 * import { a11yStory } from '@codeware/shared/util/storybook';
 *
 * export const ShadcnLight    = a11yStory({ args }, 'shadcn', 'light');
 * export const ShadcnDark     = a11yStory({ args }, 'shadcn', 'dark');
 * export const SpotlightLight = a11yStory({ args }, 'spotlight', 'light');
 * export const SpotlightDark  = a11yStory({ args }, 'spotlight', 'dark');
 * export const CodewareLight  = a11yStory({ args }, 'codeware', 'light');
 * export const CodewareDark   = a11yStory({ args }, 'codeware', 'dark');
 * // ... all four themes, or only the ones relevant to the component
 * ```
 */

import type { SbTheme } from './storybook-themes';

export type { SbTheme } from './storybook-themes';
export type ColorMode = 'light' | 'dark';

type BaseStory = {
  args?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  decorators?: unknown;
};

type A11yStory<T extends BaseStory> = T & {
  name: string;
  globals: { sbTheme: SbTheme; theme: ColorMode };
  parameters: { a11y: { test: 'error' }; docs: { disable: true } };
};

/**
 * Create a single a11y story for the given theme × mode combination.
 *
 * Always sets `parameters.a11y.test: 'error'` so axe violations fail.
 */
export function a11yStory<T extends BaseStory>(
  base: T,
  sbTheme: SbTheme,
  theme: ColorMode
): A11yStory<T> {
  return {
    ...base,
    name: `${sbTheme} / ${theme}`,
    globals: { sbTheme, theme },
    parameters: {
      ...base.parameters,
      a11y: { test: 'error' },
      docs: { disable: true }
    }
  };
}
