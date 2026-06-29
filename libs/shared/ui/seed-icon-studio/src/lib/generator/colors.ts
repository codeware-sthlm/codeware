import type { SeedIconPalette, SeedIconSketchTheme } from '../types';

/** Five HSL colour roles used by solid and vibrant pattern builders. */
export type Colors = {
  /** Background fill for the icon's bounding rect. */
  bg: string;
  /** Primary mid-tone shape fill. */
  mid: string;
  /** Secondary accent shape fill. */
  accent: string;
  /** Dark underlay/depth colour. */
  shadow: string;
  /** High-contrast highlight or focal dot colour. */
  pop: string;
};

/**
 * Derive a `Colors` set from the RNG stream, optionally constrained to a named palette.
 *
 * @param rng Stateful pseudo-random function — call order must stay stable across palette branches.
 * @param palette Named colour palette; falls back to an unconstrained hue pair when omitted.
 */
// Each case calls rng() a fixed number of times — call order relative to other rng consumers must stay stable
export function buildColors(
  rng: () => number,
  palette?: SeedIconPalette
): Colors {
  switch (palette) {
    case 'warm': {
      const hBg = Math.floor(rng() * 40),
        hMid = Math.floor(20 + rng() * 60),
        hAcc = Math.floor(rng() * 30);
      return {
        bg: `hsl(${hBg} 60% 30%)`,
        mid: `hsl(${hMid} 75% 52%)`,
        accent: `hsl(${hAcc} 80% 68%)`,
        shadow: `hsl(${hBg} 55% 18%)`,
        pop: `hsl(50 90% 78%)`
      };
    }
    case 'cool': {
      const hBg = Math.floor(200 + rng() * 60),
        hMid = Math.floor(185 + rng() * 90),
        hAcc = Math.floor(220 + rng() * 80);
      return {
        bg: `hsl(${hBg} 60% 20%)`,
        mid: `hsl(${hMid} 65% 50%)`,
        accent: `hsl(${hAcc} 70% 68%)`,
        shadow: `hsl(${hBg} 55% 10%)`,
        pop: `hsl(170 80% 72%)`
      };
    }
    case 'mono': {
      const hue = Math.floor(rng() * 360);
      return {
        bg: `hsl(${hue} 18% 18%)`,
        mid: `hsl(${hue} 22% 42%)`,
        accent: `hsl(${hue} 28% 62%)`,
        shadow: `hsl(${hue} 15% 10%)`,
        pop: `hsl(${hue} 20% 84%)`
      };
    }
    case 'pastel': {
      const h1 = Math.floor(rng() * 360),
        h2 = (h1 + 40 + Math.floor(rng() * 80)) % 360;
      return {
        bg: `hsl(${h1} 50% 86%)`,
        mid: `hsl(${h2} 55% 74%)`,
        accent: `hsl(${(h1 + 20) % 360} 60% 82%)`,
        shadow: `hsl(${h1} 35% 64%)`,
        pop: `hsl(${(h2 + 30) % 360} 70% 55%)`
      };
    }
    case 'neon': {
      const h1 = Math.floor(rng() * 360),
        h2 = (h1 + 120 + Math.floor(rng() * 60)) % 360;
      return {
        bg: `hsl(260 30% 8%)`,
        mid: `hsl(${h1} 95% 58%)`,
        accent: `hsl(${h2} 90% 65%)`,
        shadow: `hsl(260 20% 4%)`,
        pop: `hsl(${(h1 + 180) % 360} 100% 75%)`
      };
    }
    case 'earth': {
      const h1 = 20 + Math.floor(rng() * 40),
        h2 = 80 + Math.floor(rng() * 60);
      return {
        bg: `hsl(${h1} 38% 22%)`,
        mid: `hsl(${h2} 42% 38%)`,
        accent: `hsl(${h1} 48% 52%)`,
        shadow: `hsl(${h1} 35% 12%)`,
        pop: `hsl(45 65% 72%)`
      };
    }
    default: {
      // Fully unconstrained: any hue pair — used when palette is omitted or unrecognised
      const h1 = Math.floor(rng() * 360),
        h2 = (h1 + 30 + Math.floor(rng() * 60)) % 360;
      return {
        bg: `hsl(${h1} 55% 24%)`,
        mid: `hsl(${h2} 68% 50%)`,
        accent: `hsl(${h1} 72% 68%)`,
        shadow: `hsl(${h1} 50% 13%)`,
        pop: `hsl(${(h2 + 40) % 360} 80% 78%)`
      };
    }
  }
}

/** Static fg/bg colour pairs for every named sketch theme. */
export const SKETCH_THEMES: Record<
  SeedIconSketchTheme,
  { fg: string; bg: string }
> = {
  current: { fg: 'currentColor', bg: 'transparent' },
  ink: { fg: '#111111', bg: '#ffffff' },
  chalk: { fg: '#f0ede8', bg: '#161616' },
  slate: { fg: '#1e293b', bg: '#f1f5f9' },
  cobalt: { fg: '#1d4ed8', bg: '#eff6ff' },
  forest: { fg: '#15803d', bg: '#f0fdf4' },
  wine: { fg: '#9f1239', bg: '#fff1f2' },
  ember: { fg: '#b45309', bg: '#fffbeb' },
  violet: { fg: '#6d28d9', bg: '#f5f3ff' }
};
