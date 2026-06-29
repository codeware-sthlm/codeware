import type { SeedIconOptions } from '../types';

import { SKETCH_THEMES, buildColors } from './colors';
import { buildSketchContent } from './patterns-sketch';
import { buildSolidContent } from './patterns-solid';
import { buildTechContent } from './patterns-tech';
import { buildVibrantContent } from './patterns-vibrant';

/** Produce a stable 32-bit integer hash from a string (djb2 XOR variant). */
// djb2 variant: hash = hash * 33 XOR charCode (produces well-distributed 32-bit ints)
function hashCode(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++)
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  return Math.abs(hash);
}

/** Create a stateful LCG pseudo-random number generator seeded from a 32-bit integer. */
// LCG (Knuth multiplicative): produces a pseudo-random float in [0, 1) from a seed
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223;
    return (s >>> 0) / 0xffffffff;
  };
}

/**
 * Generate a deterministic SVG icon string from an arbitrary seed string.
 *
 * @param seed Any non-empty string; the same seed + options always produces the same SVG.
 * @param options Visual options (style, shape, palette, theme); all fields are optional.
 * @returns A complete `<svg>` element string ready for `innerHTML` or file output.
 */
export function generateSeedIcon(
  seed: string,
  options: SeedIconOptions = {}
): string {
  const h = hashCode(seed || 'seed');
  const rng = makeRng(h);
  const {
    palette,
    shape = 'sharp',
    style = 'solid',
    sketchTheme = 'current',
    techTheme = 'dark'
  } = options;
  const open = `<svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">`;
  const bgRx = shape === 'soft' ? '16' : '';

  if (style === 'sketch') {
    let fg: string, bg: string;
    if (sketchTheme === 'current') {
      // Seed-derived hue, transparent background — adapts to any surface
      const hue = (Math.abs(h) * 137) % 360;
      fg = `hsl(${Math.floor(hue)}, 70%, 38%)`;
      bg = 'transparent';
    } else {
      ({ fg, bg } = SKETCH_THEMES[sketchTheme]);
    }
    const content = buildSketchContent(h, rng, fg);
    const hasBg = bg !== 'transparent';
    const bgRxAttr = shape === 'soft' ? ` rx="${bgRx}"` : '';
    const bgRect = hasBg
      ? `<rect width="100" height="100"${bgRxAttr} fill="${bg}"/>`
      : '';
    if (shape === 'circular') {
      const clipId = `si${h.toString(36)}`;
      return `${open}<defs><clipPath id="${clipId}"><circle cx="50" cy="50" r="50"/></clipPath></defs><g clip-path="url(#${clipId})">${bgRect}${content}</g></svg>`;
    }
    return `${open}${bgRect}${content}</svg>`;
  }

  if (style === 'tech') {
    const bgRxAttr = shape === 'soft' ? ` rx="${bgRx}"` : '';
    // Hue biased toward teal / cyan / blue / purple range
    const hueBase = [175, 195, 215, 245, 265, 285][h % 6];
    const hue = hueBase + Math.floor(rng() * 20);
    const c1 = `hsl(${hue}, 90%, 65%)`;
    const c2 = `hsl(${(hue + 30) % 360}, 80%, 55%)`;
    const bgRect =
      techTheme === 'current'
        ? ''
        : `<rect width="100" height="100"${bgRxAttr} fill="hsl(${hue - 20}, 50%, 7%)"/>`;
    const content = buildTechContent(h, rng, c1, c2);
    if (shape === 'circular') {
      const clipId = `si${h.toString(36)}`;
      return `${open}<defs><clipPath id="${clipId}"><circle cx="50" cy="50" r="50"/></clipPath></defs><g clip-path="url(#${clipId})">${bgRect}${content}</g></svg>`;
    }
    return `${open}${bgRect}${content}</svg>`;
  }

  const colors = buildColors(rng, palette);
  const raw =
    style === 'vibrant'
      ? buildVibrantContent(h, rng, colors, bgRx)
      : buildSolidContent(h, rng, colors, bgRx);
  if (shape === 'circular') {
    const clipId = `si${h.toString(36)}`;
    return `${open}<defs><clipPath id="${clipId}"><circle cx="50" cy="50" r="50"/></clipPath></defs><g clip-path="url(#${clipId})">${raw}</g></svg>`;
  }
  return `${open}${raw}</svg>`;
}
