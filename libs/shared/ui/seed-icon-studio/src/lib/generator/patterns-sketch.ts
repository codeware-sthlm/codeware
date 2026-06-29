// Sketch style: single-colour stroke patterns on transparent or themed backgrounds — hand-drawn, icon-like aesthetic
import { arcSeg, f, lerp, polar, polyPoints } from './math';

/**
 * Build the inner SVG elements for a sketch-style icon (stroke-only, no fills).
 *
 * @param h Integer hash derived from the seed — selects and parameterises the pattern variant.
 * @param rng Stateful RNG for per-icon variance within the selected pattern.
 * @param fg Foreground stroke colour (HSL string or `currentColor`).
 * @returns SVG element string (pattern strokes only, no background or outer `<svg>` wrapper).
 */
export function buildSketchContent(
  h: number,
  rng: () => number,
  fg: string
): string {
  const sw = 4.5,
    thin = sw * 0.5;
  const S = `stroke="${fg}" stroke-width="${f(sw)}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const St = `stroke="${fg}" stroke-width="${f(thin)}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const dot = (x: number, y: number, r = sw * 0.9) =>
    `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fg}"/>`;
  switch (h % 10) {
    case 0: {
      const count = 2 + Math.floor(rng() * 3),
        baseRot = rng() * 360,
        baseSpan = 160 + rng() * 160;
      const arcs = Array.from({ length: count }, (_, i) => {
        const r = 14 + i * Math.floor(32 / count),
          span = baseSpan - i * 18,
          rot = baseRot + i * 12;
        return `<path d="${arcSeg(50, 50, r, rot, rot + span)}" ${i === 0 ? S : St}/>`;
      }).join('');
      return `${arcs}${dot(50, 50)}`;
    }
    case 1: {
      const count = 3 + Math.floor(rng() * 6),
        rot = rng() * (360 / count),
        r1 = 8 + rng() * 12,
        r2 = 36 + rng() * 10,
        altLen = rng() > 0.5;
      const spokes = Array.from({ length: count }, (_, i) => {
        const [x1, y1] = polar(50, 50, r1, rot + (360 / count) * i),
          r2i = altLen && i % 2 === 1 ? r2 * 0.65 : r2,
          [x2, y2] = polar(50, 50, r2i, rot + (360 / count) * i);
        return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" ${i % 2 === 0 || !altLen ? S : St}/>`;
      }).join('');
      return `${spokes}${dot(50, 50, sw * 1.1)}`;
    }
    case 2: {
      const sides = 3 + Math.floor(rng() * 4),
        rot = rng() * (360 / sides),
        outer = 38 + rng() * 6,
        gap = 10 + rng() * 10,
        layers = 2 + Math.floor(rng() * 2);
      const polys = Array.from({ length: layers }, (_, i) => {
        const r = outer - i * gap,
          rot2 = rot + i * (180 / sides) * (rng() > 0.5 ? 1 : -1);
        return `<polygon points="${polyPoints(50, 50, r, sides, rot2)}" ${i === 0 ? S : St}/>`;
      }).join('');
      return `${polys}${dot(50, 50)}`;
    }
    case 3: {
      // Inward spiral: samples lerp from rStart → rEnd over 'turns' rotations
      const turns = 1.2 + rng() * 1.6,
        rStart = 38 + rng() * 6,
        rEnd = 4 + rng() * 6,
        phase = rng() * 360;
      const pts = Array.from({ length: 81 }, (_, i) => {
        const t = i / 80,
          [x, y] = polar(
            50,
            50,
            lerp(rStart, rEnd, t),
            phase + t * turns * 360
          );
        return `${i === 0 ? 'M' : 'L'} ${f(x)},${f(y)}`;
      }).join(' ');
      return `<path d="${pts}" ${S}/>${dot(50, 50)}`;
    }
    case 4: {
      const count = 2 + Math.floor(rng() * 2),
        r = 16 + rng() * 8,
        spread = r * (0.7 + rng() * 0.5),
        rot = rng() * 360;
      const rings = Array.from({ length: count }, (_, i) => {
        const [cx, cy] = polar(
          50,
          50,
          count === 2 ? spread / 2 : spread * 0.6,
          rot + (360 / count) * i
        );
        return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" ${S}/>`;
      }).join('');
      return `${rings}${dot(50, 50)}`;
    }
    case 5: {
      const sides = rng() > 0.5 ? 4 : 6,
        rot = sides === 4 ? 45 + rng() * 30 : rng() * 30,
        outer = 38 + rng() * 6,
        inner = outer * (0.35 + rng() * 0.25),
        axisN = sides === 4 ? 2 : 3;
      const axes = Array.from({ length: axisN }, (_, i) => {
        const a = rot + 180 / sides + i * (180 / axisN),
          [x1, y1] = polar(50, 50, inner, a),
          [x2, y2] = polar(50, 50, inner, a + 180);
        return `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" ${St}/>`;
      }).join('');
      return `<polygon points="${polyPoints(50, 50, outer, sides, rot)}" ${S}/>${axes}${dot(50, 50)}`;
    }
    case 6: {
      const r = 28 + rng() * 10,
        span = 200 + rng() * 120,
        rot = rng() * 360,
        ext = 8 + rng() * 10,
        [sx, sy] = polar(50, 50, r, rot),
        [ex, ey] = polar(50, 50, r, rot + span),
        [sx2, sy2] = polar(50, 50, r + ext, rot),
        [ex2, ey2] = polar(50, 50, r + ext, rot + span);
      return `<path d="${arcSeg(50, 50, r, rot, rot + span)}" ${S}/><line x1="${f(sx)}" y1="${f(sy)}" x2="${f(sx2)}" y2="${f(sy2)}" ${S}/><line x1="${f(ex)}" y1="${f(ey)}" x2="${f(ex2)}" y2="${f(ey2)}" ${S}/>${dot(50, 50)}`;
    }
    case 7: {
      const count = 2 + Math.floor(rng() * 3),
        rot = rng() * (180 / count),
        r1 = 6 + rng() * 8,
        r2 = 36 + rng() * 8,
        taper = rng() > 0.6;
      const arms = Array.from({ length: count }, (_, i) => {
        const a1 = rot + (180 / count) * i,
          a2 = a1 + 180,
          [ax1, ay1] = polar(50, 50, r1, a1),
          [ax3, ay3] = polar(50, 50, r1, a2),
          [ax2, ay2] = polar(50, 50, r2, a1),
          [ax4, ay4] = polar(50, 50, r2, a2);
        if (taper) {
          const [bx1, by1] = polar(50, 50, r2, a1 - 6),
            [bx2, by2] = polar(50, 50, r2, a1 + 6),
            [bx3, by3] = polar(50, 50, r2, a2 - 6),
            [bx4, by4] = polar(50, 50, r2, a2 + 6);
          return `<polygon points="${f(ax1)},${f(ay1)} ${f(bx1)},${f(by1)} ${f(bx2)},${f(by2)}" fill="${fg}"/><polygon points="${f(ax3)},${f(ay3)} ${f(bx3)},${f(by3)} ${f(bx4)},${f(by4)}" fill="${fg}"/><line x1="${f(ax1)}" y1="${f(ay1)}" x2="${f(ax3)}" y2="${f(ay3)}" ${S}/>`;
        }
        return `<line x1="${f(ax2)}" y1="${f(ay2)}" x2="${f(ax4)}" y2="${f(ay4)}" ${S}/>`;
      }).join('');
      return `${arms}${dot(50, 50, sw * 1.3)}`;
    }
    case 8: {
      const w = 28 + rng() * 12,
        ht = 32 + rng() * 12,
        top = 50 - ht / 2,
        tapY = top + ht * (0.55 + rng() * 0.15),
        inset = w * 0.28,
        midY = top + ht * 0.38;
      const path = `M 50,${f(top + ht + 4)} L ${f(50 - w / 2)},${f(tapY)} L ${f(50 - w / 2)},${f(top + 6)} Q ${f(50 - w / 2)},${f(top)} ${f(50 - w / 2 + 6)},${f(top)} L ${f(50 + w / 2 - 6)},${f(top)} Q ${f(50 + w / 2)},${f(top)} ${f(50 + w / 2)},${f(top + 6)} L ${f(50 + w / 2)},${f(tapY)} Z`;
      return `<path d="${path}" ${S}/><line x1="${f(50 - w / 2 + inset)}" y1="${f(top + 8)}" x2="${f(50 + w / 2 - inset)}" y2="${f(top + 8)}" ${St}/><line x1="50" y1="${f(top + 8)}" x2="50" y2="${f(midY + 8)}" ${St}/>${dot(50, midY + 16, sw * 0.8)}`;
    }
    default: {
      // case 9: figure-eight / infinity-like bezier curve
      const a = 18 + rng() * 14,
        b = 11 + rng() * 8,
        rot = rng() * 30 - 15;
      const path = `M 50,50 C ${f(50 + a)},${f(50 - b * 2)} ${f(50 + a * 2)},${f(50 - b)} ${f(50 + a * 2)},50 C ${f(50 + a * 2)},${f(50 + b)} ${f(50 + a)},${f(50 + b * 2)} 50,50 C ${f(50 - a)},${f(50 - b * 2)} ${f(50 - a * 2)},${f(50 - b)} ${f(50 - a * 2)},50 C ${f(50 - a * 2)},${f(50 + b)} ${f(50 - a)},${f(50 + b * 2)} 50,50 Z`;
      return `<path d="${path}" ${S} transform="rotate(${f(rot)} 50 50)"/>${dot(50, 50)}`;
    }
  }
}
