/**
 * shadcn's own tinted neutrals, which Tailwind does not ship.
 *
 * The create tool at `ui.shadcn.com/create` offers these four alongside the
 * Tailwind neutrals. They cannot live in `tailwind-colors.ts` — that file is
 * defined as an extraction of `tailwindcss/colors` and is tested against it.
 *
 * Values from `shadcn-ui/ui`, `packages/shadcn/src/colors.ts` (MIT), rewritten
 * from percent to fractional lightness to match the Tailwind palette's form.
 * They are the same colour space: that file's Tailwind ramps agree with ours
 * exactly, which is what makes these safe to mix with them.
 */
export const shadcnNeutrals = {
  mauve: {
    '50': 'oklch(0.985 0 0)',
    '100': 'oklch(0.96 0.003 325.6)',
    '200': 'oklch(0.922 0.005 325.62)',
    '300': 'oklch(0.865 0.012 325.68)',
    '400': 'oklch(0.711 0.019 323.02)',
    '500': 'oklch(0.542 0.034 322.5)',
    '600': 'oklch(0.435 0.029 321.78)',
    '700': 'oklch(0.364 0.029 323.89)',
    '800': 'oklch(0.263 0.024 320.12)',
    '900': 'oklch(0.212 0.019 322.12)',
    '950': 'oklch(0.145 0.008 326)'
  },
  olive: {
    '50': 'oklch(0.988 0.003 106.5)',
    '100': 'oklch(0.966 0.005 106.5)',
    '200': 'oklch(0.93 0.007 106.5)',
    '300': 'oklch(0.88 0.011 106.6)',
    '400': 'oklch(0.737 0.021 106.9)',
    '500': 'oklch(0.58 0.031 107.3)',
    '600': 'oklch(0.466 0.025 107.3)',
    '700': 'oklch(0.394 0.023 107.4)',
    '800': 'oklch(0.286 0.016 107.4)',
    '900': 'oklch(0.228 0.013 107.4)',
    '950': 'oklch(0.153 0.006 107.1)'
  },
  mist: {
    '50': 'oklch(0.987 0.002 197.1)',
    '100': 'oklch(0.963 0.002 197.1)',
    '200': 'oklch(0.925 0.005 214.3)',
    '300': 'oklch(0.872 0.007 219.6)',
    '400': 'oklch(0.723 0.014 214.4)',
    '500': 'oklch(0.56 0.021 213.5)',
    '600': 'oklch(0.45 0.017 213.2)',
    '700': 'oklch(0.378 0.015 216)',
    '800': 'oklch(0.275 0.011 216.9)',
    '900': 'oklch(0.218 0.008 223.9)',
    '950': 'oklch(0.148 0.004 228.8)'
  },
  taupe: {
    '50': 'oklch(0.986 0.002 67.8)',
    '100': 'oklch(0.96 0.002 17.2)',
    '200': 'oklch(0.922 0.005 34.3)',
    '300': 'oklch(0.868 0.007 39.5)',
    '400': 'oklch(0.714 0.014 41.2)',
    '500': 'oklch(0.547 0.021 43.1)',
    '600': 'oklch(0.438 0.017 39.3)',
    '700': 'oklch(0.367 0.016 35.7)',
    '800': 'oklch(0.268 0.011 36.5)',
    '900': 'oklch(0.214 0.009 43.1)',
    '950': 'oklch(0.147 0.004 49.3)'
  }
} as const;

/** A family defined here rather than by Tailwind. */
export type ShadcnNeutralFamily = keyof typeof shadcnNeutrals;
