// Solid style: flat geometric shapes on a single background — clean, badge-like aesthetic
import type { Colors } from './colors';
import { polyPoints, sectorPath, starPoints } from './math';

/**
 * Build the inner SVG elements for a solid-style icon.
 *
 * @param h Integer hash derived from the seed — selects and parameterises the pattern variant.
 * @param rng Stateful RNG for per-icon variance within the selected pattern.
 * @param c Colour roles for this icon.
 * @param rx Corner-radius value string for soft-shape rects (empty string = sharp corners).
 * @returns SVG element string (background rect + pattern shapes, no outer `<svg>` wrapper).
 */
export function buildSolidContent(
  h: number,
  rng: () => number,
  c: Colors,
  rx: string
) {
  const rxa = rx ? ` rx="${rx}"` : '';
  const bg = `<rect width="100" height="100"${rxa} fill="${c.bg}"/>`;
  const s = h % 12;
  if (s === 0) {
    const a = 20 + Math.floor(rng() * 30),
      off = 18 + Math.floor(rng() * 14);
    return `${bg}<rect x="-20" y="${off}" width="140" height="50" fill="${c.shadow}" opacity="0.9" transform="rotate(-${a} 50 50)"/><rect x="-20" y="${off + 18}" width="140" height="34" fill="${c.mid}" transform="rotate(-${a} 50 50)"/><rect x="-20" y="${off + 34}" width="140" height="18" fill="${c.accent}" opacity="0.85" transform="rotate(-${a} 50 50)"/><circle cx="${20 + Math.floor(rng() * 20)}" cy="${60 + Math.floor(rng() * 20)}" r="9" fill="${c.pop}" opacity="0.9"/>`;
  }
  if (s === 1) {
    const cx = 38 + Math.floor(rng() * 24),
      cy = 38 + Math.floor(rng() * 24);
    return `${bg}<circle cx="${cx + 6}" cy="${cy + 6}" r="44" fill="${c.shadow}" opacity="0.7"/><circle cx="${cx}" cy="${cy}" r="44" fill="${c.mid}"/><circle cx="${cx}" cy="${cy}" r="26" fill="${c.bg}"/><circle cx="${cx}" cy="${cy}" r="13" fill="${c.accent}"/><circle cx="${cx}" cy="${cy}" r="5" fill="${c.pop}"/>`;
  }
  if (s === 2) {
    const n = 5 + (h % 3),
      rot = Math.floor(rng() * 40),
      pts = starPoints(50, 50, 46, 18, n, rot - 90);
    return `${bg}<circle cx="50" cy="50" r="48" fill="${c.shadow}" opacity="0.4"/><polygon points="${pts}" fill="${c.mid}"/><polygon points="${starPoints(50, 50, 46, 18, n, rot - 90 + 180 / n)}" fill="${c.accent}" opacity="0.35"/><circle cx="50" cy="50" r="14" fill="${c.bg}"/><circle cx="50" cy="50" r="6" fill="${c.pop}"/>`;
  }
  if (s === 3) {
    const horiz = rng() > 0.5,
      flip = rng() > 0.5;
    const sp = horiz
      ? flip
        ? '0,0 100,0 100,100'
        : '0,0 100,100 0,100'
      : flip
        ? '0,0 100,0 0,100'
        : '100,0 100,100 0,100';
    const dx = horiz ? (flip ? 68 : 32) : flip ? 32 : 68,
      dy = horiz ? (flip ? 32 : 68) : 50;
    return `${bg}<polygon points="${sp}" fill="${c.mid}"/><circle cx="${dx}" cy="${dy}" r="19" fill="${c.shadow}" opacity="0.6"/><circle cx="${dx}" cy="${dy}" r="13" fill="${c.accent}"/><circle cx="${dx}" cy="${dy}" r="5" fill="${c.pop}"/>`;
  }
  if (s === 4) {
    const n = 3 + (h % 4),
      rot = Math.floor(rng() * 60);
    return `${bg}<polygon points="${polyPoints(50, 50, 48, n, rot)}" fill="${c.shadow}" opacity="0.6"/><polygon points="${polyPoints(50, 50, 46, n, rot)}" fill="${c.mid}"/><polygon points="${polyPoints(50, 50, 30, n, rot + 15)}" fill="${c.bg}"/><polygon points="${polyPoints(50, 50, 20, n, rot)}" fill="${c.accent}"/><circle cx="50" cy="50" r="7" fill="${c.pop}"/>`;
  }
  if (s === 5) {
    const a1 = Math.floor(rng() * 360),
      s1 = 80 + Math.floor(rng() * 100),
      s2 = 40 + Math.floor(rng() * 80);
    return `${bg}<path d="${sectorPath(50, 50, 46, a1, s1)}" fill="${c.mid}"/><path d="${sectorPath(50, 50, 46, a1 + s1, s2)}" fill="${c.accent}" opacity="0.85"/><circle cx="50" cy="50" r="20" fill="${c.bg}"/><circle cx="50" cy="50" r="7" fill="${c.pop}"/>`;
  }
  if (s === 6) {
    const rot = Math.floor(rng() * 45),
      w1 = 22 + Math.floor(rng() * 12),
      w2 = 14 + Math.floor(rng() * 10);
    return `${bg}<rect x="${(100 - w1) / 2}" y="5" width="${w1}" height="90" fill="${c.mid}" transform="rotate(${rot} 50 50)"/><rect x="5" y="${(100 - w2) / 2}" width="90" height="${w2}" fill="${c.accent}" opacity="0.8" transform="rotate(${rot} 50 50)"/><circle cx="50" cy="50" r="13" fill="${c.bg}"/><circle cx="50" cy="50" r="6" fill="${c.pop}"/>`;
  }
  if (s === 7) {
    const cx = 30 + Math.floor(rng() * 40),
      cy = 30 + Math.floor(rng() * 40),
      bigR = 55 + Math.floor(rng() * 15),
      a1 = Math.floor(rng() * 360),
      sw = 140 + Math.floor(rng() * 80);
    return `${bg}<path d="${sectorPath(cx, cy, bigR, a1, sw)}" fill="${c.mid}"/><circle cx="${cx}" cy="${cy}" r="22" fill="${c.bg}"/><circle cx="${cx}" cy="${cy}" r="10" fill="${c.accent}"/><circle cx="${cx}" cy="${cy}" r="4" fill="${c.pop}"/>`;
  }
  if (s === 8) {
    const dots = Array.from({ length: 9 }, (_, i) => {
      const row = Math.floor(i / 3),
        col = i % 3,
        cx = 20 + col * 30 + Math.floor(rng() * 14) - 7,
        cy = 20 + row * 30 + Math.floor(rng() * 14) - 7,
        r = 4 + Math.floor(rng() * 12),
        fill = i % 3 === 0 ? c.pop : i % 3 === 1 ? c.mid : c.accent;
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${(0.55 + rng() * 0.45).toFixed(2)}"/>`;
    }).join('');
    return `${bg}${dots}`;
  }
  if (s === 9) {
    const sz = 38 + Math.floor(rng() * 14),
      g = 10 + Math.floor(rng() * 8);
    return `${bg}<rect x="${50 - sz / 2 - g}" y="${50 - sz / 2 - g}" width="${sz}" height="${sz}"${rxa} fill="${c.shadow}" opacity="0.7"/><rect x="${50 - sz / 2 + g}" y="${50 - sz / 2 - g}" width="${sz}" height="${sz}"${rxa} fill="${c.mid}"/><rect x="${50 - sz / 2}" y="${50 - sz / 2 + g}" width="${sz}" height="${sz}"${rxa} fill="${c.accent}" opacity="0.85"/><circle cx="50" cy="50" r="8" fill="${c.pop}"/>`;
  }
  if (s === 10) {
    const count = 4 + (h % 4),
      offset = Math.floor(rng() * 360);
    const wedges = Array.from({ length: count }, (_, i) => {
      const fills = [c.mid, c.accent, c.shadow, c.pop];
      return `<path d="${sectorPath(50, 50, 48, offset + (360 / count) * i, 360 / count - 2)}" fill="${fills[i % fills.length]}" opacity="${i % 2 === 0 ? '1' : '0.7'}"/>`;
    }).join('');
    return `${bg}${wedges}<circle cx="50" cy="50" r="18" fill="${c.bg}"/><circle cx="50" cy="50" r="7" fill="${c.pop}"/>`;
  }
  // s === 11: 3×3 grid of rotated squares radiating from centre
  const sz = 26 + Math.floor(rng() * 12),
    gap = 4;
  const cells = [-1, 0, 1]
    .flatMap((row) =>
      [-1, 0, 1].map((col) => {
        const cx = 50 + col * (sz + gap),
          cy = 50 + row * (sz + gap),
          dist = Math.abs(row) + Math.abs(col),
          fill = dist === 0 ? c.pop : dist === 1 ? c.accent : c.mid;
        return `<polygon points="${polyPoints(cx, cy, sz / 2, 4, 45)}" fill="${fill}" opacity="${(1 - dist * 0.15).toFixed(2)}"/>`;
      })
    )
    .join('');
  return `${bg}${cells}`;
}
