import { tailwindColors } from './tailwind-colors';

// Color levels can be extracted from any color name since they are consistent
type ColorLevel = keyof (typeof tailwindColors)['amber'];

// Resolve color names that have levels
type ColorName = keyof typeof tailwindColors;
type ColorWithLevel = {
  [K in ColorName]: (typeof tailwindColors)[K] extends Record<string, string>
    ? K
    : never;
}[ColorName];

// A workaround since `Exclude` is not type-safe:
// Verify that white and black exist in ColorName
type VerifyColorsExist<T extends ColorName> = T;
type ValidSingleColors = VerifyColorsExist<'white' | 'black'>;

/**
 * Tailwind color names without the utility prefix
 */
export type TailwindColor =
  | `${ColorWithLevel}-${ColorLevel}`
  | ValidSingleColors;

export type Color = {
  /**
   * Tailwind color code
   * @example 'oklch(0.554 0.046 257.417)'
   */
  code: string;

  /**
   * Tailwind color name without the utility prefix
   * @example 'slate-500'
   */
  name: TailwindColor;
};
