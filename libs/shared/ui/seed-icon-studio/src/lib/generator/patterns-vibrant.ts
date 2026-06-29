// Vibrant style: bold overlapping shapes with high colour contrast — energetic, abstract aesthetic
import type { Colors } from './colors';
import { arcSeg, polyPoints, sectorPath } from './math';

/**
 * Build the inner SVG elements for a vibrant-style icon.
 *
 * @param h Integer hash derived from the seed — selects and parameterises the pattern variant.
 * @param rng Stateful RNG for per-icon variance within the selected pattern.
 * @param c Colour roles for this icon.
 * @param rx Corner-radius value string for soft-shape rects (empty string = sharp corners).
 * @returns SVG element string (background rect + pattern shapes, no outer `<svg>` wrapper).
 */
export function buildVibrantContent(
  h: number,
  rng: () => number,
  c: Colors,
  rx: string
) {
  const rxa = rx ? ` rx="${rx}"` : '';
  const bg = `<rect width="100" height="100"${rxa} fill="${c.bg}"/>`;
  const s = h % 8;
  if (s === 0) {
    const cx = 35 + Math.floor(rng() * 30),
      cy = 35 + Math.floor(rng() * 30);
    return `${bg}<circle cx="${cx}" cy="${cy}" r="70" fill="${c.shadow}"/><circle cx="${cx}" cy="${cy}" r="54" fill="${c.mid}"/><circle cx="${cx}" cy="${cy}" r="36" fill="${c.accent}"/><circle cx="${cx}" cy="${cy}" r="18" fill="${c.pop}"/><circle cx="${cx}" cy="${cy}" r="7" fill="${c.bg}"/>`;
  }
  if (s === 1) {
    const rot = Math.floor(rng() * 30) - 15;
    return `${bg}<polygon points="${polyPoints(50, 72, 38, 3, rot)}" fill="${c.shadow}"/><polygon points="${polyPoints(50, 60, 30, 3, rot + 10)}" fill="${c.mid}"/><polygon points="${polyPoints(50, 48, 22, 3, rot + 5)}" fill="${c.accent}"/><polygon points="${polyPoints(50, 38, 14, 3, rot + 15)}" fill="${c.pop}"/>`;
  }
  if (s === 2) {
    const base = Math.floor(rng() * 360),
      spans = [220, 190, 160, 120],
      radii = [42, 32, 22, 12],
      cols = [c.pop, c.accent, c.mid, c.shadow];
    return `${bg}${spans.map((span, i) => `<path d="${arcSeg(50, 50, radii[i], base + i * 25, base + i * 25 + span)}" fill="none" stroke="${cols[i]}" stroke-width="7" stroke-linecap="round"/>`).join('')}`;
  }
  if (s === 3) {
    const rot = Math.floor(rng() * 45);
    return `${bg}<rect x="4" y="4" width="92" height="92"${rxa} fill="${c.mid}" transform="rotate(${rot} 50 50)"/><rect x="4" y="4" width="46" height="92" fill="${c.accent}" transform="rotate(${rot} 50 50)"/><circle cx="50" cy="50" r="24" fill="${c.bg}"/><circle cx="50" cy="50" r="12" fill="${c.pop}"/>`;
  }
  if (s === 4) {
    const ex1 = 30 + Math.floor(rng() * 20),
      ey1 = 35 + Math.floor(rng() * 20),
      ex2 = 55 + Math.floor(rng() * 20),
      ey2 = 45 + Math.floor(rng() * 20);
    return `${bg}<ellipse cx="${ex1}" cy="${ey1}" rx="36" ry="28" fill="${c.mid}" opacity="0.9"/><ellipse cx="${ex2}" cy="${ey2}" rx="30" ry="24" fill="${c.accent}" opacity="0.85"/><circle cx="${(ex1 + ex2) / 2}" cy="${(ey1 + ey2) / 2}" r="11" fill="${c.pop}"/>`;
  }
  if (s === 5) {
    const w = 16 + Math.floor(rng() * 10),
      rot = 30 + Math.floor(rng() * 20);
    return `${bg}<rect x="${(100 - w) / 2}" y="8" width="${w}" height="84" fill="${c.shadow}" transform="rotate(${rot} 50 50)"/><rect x="${(100 - w) / 2}" y="8" width="${w}" height="84" fill="${c.mid}" transform="rotate(-${rot} 50 50)"/><circle cx="50" cy="50" r="16" fill="${c.bg}"/><circle cx="50" cy="50" r="8" fill="${c.pop}"/>`;
  }
  if (s === 6) {
    const n = 6 + (h % 3),
      o = Math.floor(rng() * 60),
      fills = [c.mid, c.accent, c.shadow, c.pop, c.mid, c.accent];
    const wg = Array.from(
      { length: n },
      (_, i) =>
        `<path d="${sectorPath(50, 50, 50, o + (360 / n) * i, 360 / n)}" fill="${fills[i % fills.length]}"/>`
    ).join('');
    return `${bg}${wg}<circle cx="50" cy="50" r="22" fill="${c.bg}"/><circle cx="50" cy="50" r="9" fill="${c.pop}"/>`;
  }
  // s === 7: dual overlapping rotated rectangles
  const a = 15 + Math.floor(rng() * 20),
    sz = 52 + Math.floor(rng() * 16),
    h2 = (100 - sz) / 2;
  return `${bg}<rect x="${h2 + 8}" y="${h2 + 8}" width="${sz}" height="${sz}"${rxa} fill="${c.shadow}" opacity="0.8" transform="rotate(${a} 50 50)"/><rect x="${h2}" y="${h2}" width="${sz}" height="${sz}"${rxa} fill="${c.mid}" transform="rotate(${a} 50 50)"/><rect x="${h2}" y="${h2}" width="${sz}" height="${sz}"${rxa} fill="${c.accent}" opacity="0.6" transform="rotate(-${a} 50 50)"/><circle cx="50" cy="50" r="10" fill="${c.bg}"/><circle cx="50" cy="50" r="4" fill="${c.pop}"/>`;
}
