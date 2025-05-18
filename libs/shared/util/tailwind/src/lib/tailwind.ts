import { tailwindColors } from './tailwind-colors';
import { ColorName, TailwindColor } from './types';

// Performant color lookup from color name
const tailwindColorMap = Object.entries(tailwindColors).reduce(
  (acc, [colorName, value]) => {
    if (typeof value === 'object') {
      Object.entries(value).forEach(([level, color]) => {
        const name = `${colorName}-${level}` as TailwindColor;
        acc[name] = color;
      });
    } else {
      acc[colorName as TailwindColor] = value;
    }
    return acc;
  },
  {} as Record<TailwindColor, string>
);

/**
 * A collection of utilities for performant and type-safe Tailwind color lookups.
 */
export const tailwind = {
  /**
   * A list of all tailwind color names.
   */
  names: Object.keys(tailwindColors) as Array<ColorName>,

  /**
   * A map of tailwind color names and corresponding colors.
   *
   * Use `colorMapRangeOnly` for colors with a range (e.g. `slate-500`).
   */
  colorMap: tailwindColorMap,

  /**
   * A map of tailwind color names and corresponding colors, but only for the range colors.
   * For example, `slate-500` is a range color, but `white` is not.
   *
   * Use `colorMap` for all colors.
   */
  colorMapRangeOnly: Object.fromEntries(
    Object.entries(tailwindColorMap).filter(([name]) => /-/.test(name))
  ) as Record<TailwindColor, string>,

  /**
   * Get the color code for a given color name.
   *
   * When the name has unknown type, use `colorMaybe` instead.
   *
   * @param name - The name of the color to get the code for.
   * @returns The color code for the given color name.
   *
   * @example
   * ```ts
   * const colorCode = tailwind.color('slate-500');
   * // 'oklch(0.554 0.046 257.417)'
   * ```
   */
  color: (name: TailwindColor) => tailwindColorMap[name],

  /**
   * Get the color code for a given color name with unknown type.
   *
   * Use `color` for a fully type-safe color lookup.
   *
   * @param name - The name of the color to get the code for.
   * @returns The color code or `undefined` if the name is not a valid color name.
   *
   * @example
   * ```ts
   * const colorCode = tailwind.colorMaybe('slate-500');
   * // 'oklch(0.554 0.046 257.417)'
   * const colorCode = tailwind.colorMaybe('unknown-color');
   * // undefined
   * ```
   */
  colorMaybe: (name: TailwindColor | string | null | undefined) =>
    name ? tailwindColorMap[name as TailwindColor] : undefined
};
