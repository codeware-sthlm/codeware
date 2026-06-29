// Tech style: circuit-board traces, nodes, and geometric wireframes in teal/blue/purple — technical, schematic aesthetic
import { f, polar } from './math';

/**
 * Build the inner SVG elements for a tech-style icon (circuit-board traces and nodes).
 *
 * @param h Integer hash derived from the seed — selects and parameterises the pattern variant.
 * @param rng Stateful RNG for per-icon variance within the selected pattern.
 * @param c1 Primary trace/node colour (HSL string).
 * @param c2 Secondary accent colour for alternating nodes and branches.
 * @returns SVG element string (pattern elements only, no background or outer `<svg>` wrapper).
 */
export function buildTechContent(
  h: number,
  rng: () => number,
  c1: string,
  c2: string
): string {
  const sw = '4.00';
  const seg = (x1: number, y1: number, x2: number, y2: number, c = c1) =>
    `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c}" stroke-width="${sw}" stroke-linecap="round"/>`;
  const dot = (x: number, y: number, r = 3.5, c = c1) =>
    `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${c}"/>`;
  const ring = (x: number, y: number, r = 4, c = c1) =>
    `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" stroke="${c}" stroke-width="${sw}" fill="none"/>`;
  const orth = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    bendH = true,
    c = c1
  ) => {
    const d = bendH
      ? `M ${f(x1)},${f(y1)} L ${f(x2)},${f(y1)} L ${f(x2)},${f(y2)}`
      : `M ${f(x1)},${f(y1)} L ${f(x1)},${f(y2)} L ${f(x2)},${f(y2)}`;
    return `<path d="${d}" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  };

  switch (h % 10) {
    case 0: {
      // Sparse network — nodes connected by orthogonal traces
      const count = 5 + Math.floor(rng() * 3);
      const nodes: [number, number][] = Array.from({ length: count }, () => [
        18 + Math.floor(rng() * 64),
        18 + Math.floor(rng() * 64)
      ]);
      const hubIdx = Math.floor(rng() * count);
      const lines = nodes
        .map((n, i) => {
          if (i === hubIdx) return '';
          return orth(
            nodes[hubIdx][0],
            nodes[hubIdx][1],
            n[0],
            n[1],
            rng() > 0.5,
            i % 2 ? c2 : c1
          );
        })
        .join('');
      const dots = nodes
        .map(([x, y], i) =>
          dot(x, y, i === hubIdx ? 5.5 : 3, i === hubIdx ? c1 : c2)
        )
        .join('');
      return `${lines}${dots}`;
    }
    case 1: {
      // Hexagon with circuit arms
      const r = 30 + Math.floor(rng() * 8);
      const rot = 30 + Math.floor(rng() * 15);
      const pts = Array.from({ length: 6 }, (_, i) =>
        polar(50, 50, r, rot + 60 * i)
      );
      const hex = `<polygon points="${pts.map(([x, y]) => `${f(x)},${f(y)}`).join(' ')}" stroke="${c1}" stroke-width="${sw}" fill="none"/>`;
      const arms = pts
        .map(([x, y], i) => {
          const armLen = 8 + Math.floor(rng() * 10);
          const [ex, ey] = polar(50, 50, r + armLen, rot + 60 * i);
          const c = i % 2 ? c2 : c1;
          return seg(x, y, ex, ey, c) + dot(ex, ey, 2.5, c);
        })
        .join('');
      const midDots = pts
        .map(([x, y], i) => {
          const [nx, ny] = pts[(i + 1) % 6];
          return dot((x + nx) / 2, (y + ny) / 2, 1.5, c2);
        })
        .join('');
      return `${hex}${arms}${midDots}${dot(50, 50, 4)}`;
    }
    case 2: {
      // Triangle with corner traces
      const rot = -90 + Math.floor(rng() * 20);
      const r = 34 + Math.floor(rng() * 8);
      const pts = Array.from({ length: 3 }, (_, i) =>
        polar(50, 50, r, rot + 120 * i)
      );
      const tri = `<polygon points="${pts.map(([x, y]) => `${f(x)},${f(y)}`).join(' ')}" stroke="${c1}" stroke-width="${sw}" fill="none"/>`;
      const decorations = pts
        .map(([x, y], i) => {
          const [ex, ey] = polar(
            50,
            50,
            r + 12 + Math.floor(rng() * 8),
            rot + 120 * i
          );
          const c = i === 0 ? c1 : c2;
          return (
            seg(x, y, ex, ey, c) + dot(ex, ey, 2.5, c) + dot(x, y, 3.5, c1)
          );
        })
        .join('');
      return `${tri}${decorations}${dot(50, 50, 3, c2)}`;
    }
    case 3: {
      // Concentric arc segments
      const baseRot = Math.floor(rng() * 360);
      const count = 3 + Math.floor(rng() * 2);
      const arcs = Array.from({ length: count }, (_, i) => {
        const r = 10 + i * 11 + Math.floor(rng() * 4);
        const span = 70 + Math.floor(rng() * 110);
        const rot = baseRot + i * 18 * (rng() > 0.5 ? 1 : -1);
        const c = i % 2 ? c2 : c1;
        const [x1, y1] = polar(50, 50, r, rot);
        const [x2, y2] = polar(50, 50, r, rot + span);
        const d = `M ${f(x1)},${f(y1)} A ${r},${r} 0 ${span > 180 ? 1 : 0} 1 ${f(x2)},${f(y2)}`;
        return (
          `<path d="${d}" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" fill="none"/>` +
          dot(x1, y1, 2.5, c) +
          dot(x2, y2, 2.5, c)
        );
      }).join('');
      return `${arcs}${dot(50, 50, 4)}`;
    }
    case 4: {
      // Circuit cross with node dots and branches
      const ext = 28 + Math.floor(rng() * 10);
      const cross =
        seg(50 - ext, 50, 50 + ext, 50) + seg(50, 50 - ext, 50, 50 + ext);
      const caps: [number, number][] = [
        [50 - ext, 50],
        [50 + ext, 50],
        [50, 50 - ext],
        [50, 50 + ext]
      ];
      const branches = caps
        .map(([x, y], i) => {
          const c = i % 2 ? c2 : c1;
          const bx = x !== 50 ? x : x + (rng() > 0.5 ? 10 : -10);
          const by = y !== 50 ? y + (rng() > 0.5 ? 12 : -12) : y;
          return (
            dot(x, y, 3.5, c1) +
            orth(x, y, bx, by, x !== 50, c) +
            dot(bx, by, 2, c)
          );
        })
        .join('');
      return `${cross}${branches}${dot(50, 50, 5)}`;
    }
    case 5: {
      // Radial hub with spoke branches
      const count = 6 + Math.floor(rng() * 3);
      const rot = Math.floor(rng() * (360 / count));
      const spokes = Array.from({ length: count }, (_, i) => {
        const angle = rot + (360 / count) * i;
        const [x1, y1] = polar(50, 50, 8, angle);
        const r2 = 30 + Math.floor(rng() * 12);
        const [x2, y2] = polar(50, 50, r2, angle);
        const c = i % 3 === 0 ? c1 : c2;
        const hasBranch = rng() > 0.55;
        const [bx, by] = polar(
          x2,
          y2,
          10 + Math.floor(rng() * 8),
          angle + (rng() > 0.5 ? 70 : -70)
        );
        return (
          seg(x1, y1, x2, y2, c) +
          dot(x2, y2, 2.5, c) +
          (hasBranch ? seg(x2, y2, bx, by, c2) + dot(bx, by, 1.5, c2) : '')
        );
      }).join('');
      return `${spokes}${ring(50, 50, 8)}${dot(50, 50, 3, c2)}`;
    }
    case 6: {
      // Connected ring of nodes
      const count = 4 + Math.floor(rng() * 4);
      const rot = Math.floor(rng() * (360 / count));
      const nodes = Array.from({ length: count }, (_, i) =>
        polar(50, 50, 32 + Math.floor(rng() * 8) - 4, rot + (360 / count) * i)
      );
      const ringLines = nodes
        .map(([x, y], i) => {
          const [nx, ny] = nodes[(i + 1) % count];
          return seg(x, y, nx, ny, i % 2 ? c2 : c1);
        })
        .join('');
      const hubLines = nodes
        .filter((_, i) => i % 2 === 0)
        .map(([x, y]) => seg(50, 50, x, y, c2))
        .join('');
      const dots = nodes
        .map(([x, y], i) => dot(x, y, i % 3 === 0 ? 4.5 : 3, i % 2 ? c2 : c1))
        .join('');
      return `${ringLines}${hubLines}${dots}${dot(50, 50, 4.5)}`;
    }
    case 7: {
      // Corner brackets with center element
      const bSize = 14 + Math.floor(rng() * 8);
      const corners: [number, number][] = [
        [14, 14],
        [86, 14],
        [86, 86],
        [14, 86]
      ];
      const brackets = corners
        .map(([cx, cy], i) => {
          const dx = cx < 50 ? 1 : -1,
            dy = cy < 50 ? 1 : -1;
          const c = i % 2 ? c2 : c1;
          const d = `M ${f(cx)},${f(cy + dy * bSize)} L ${f(cx)},${f(cy)} L ${f(cx + dx * bSize)},${f(cy)}`;
          return (
            `<path d="${d}" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
            dot(cx + dx * bSize, cy, 2.5, c) +
            dot(cx, cy + dy * bSize, 2.5, c)
          );
        })
        .join('');
      const cr = 10 + Math.floor(rng() * 8);
      const center = `<rect x="${f(50 - cr)}" y="${f(50 - cr)}" width="${f(cr * 2)}" height="${f(cr * 2)}" stroke="${c1}" stroke-width="${sw}" fill="none"/>`;
      return `${brackets}${center}${dot(50, 50, 3, c2)}`;
    }
    case 8: {
      // Dot matrix with selective connections
      const rows = 4,
        cols = 4,
        spacing = 18;
      const ox = 50 - ((cols - 1) * spacing) / 2;
      const oy = 50 - ((rows - 1) * spacing) / 2;
      const grid = Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c): [number, number] => [
          ox + c * spacing,
          oy + r * spacing
        ])
      );
      const connections = grid
        .flatMap((row, r) =>
          row.flatMap(([x, y], c) => {
            const out: string[] = [];
            if (c < cols - 1 && rng() > 0.35)
              out.push(seg(x, y, row[c + 1][0], y, (r + c) % 2 ? c2 : c1));
            if (r < rows - 1 && rng() > 0.35)
              out.push(seg(x, y, x, grid[r + 1][c][1], (r + c) % 2 ? c1 : c2));
            return out;
          })
        )
        .join('');
      const dots = grid
        .flat()
        .map(([x, y], i) => dot(x, y, rng() > 0.65 ? 4 : 2.5, i % 3 ? c2 : c1))
        .join('');
      return `${connections}${dots}`;
    }
    default: {
      // Diamond with inner circuit and radial traces
      const r = 34 + Math.floor(rng() * 6);
      const pts = Array.from({ length: 4 }, (_, i) => polar(50, 50, r, i * 90));
      const diamond = `<polygon points="${pts.map(([x, y]) => `${f(x)},${f(y)}`).join(' ')}" stroke="${c1}" stroke-width="${sw}" fill="none"/>`;
      const innerR = r * 0.45;
      const innerPts = Array.from({ length: 4 }, (_, i) =>
        polar(50, 50, innerR, i * 90 + 45)
      );
      const inner = `<polygon points="${innerPts.map(([x, y]) => `${f(x)},${f(y)}`).join(' ')}" stroke="${c2}" stroke-width="${sw}" fill="none"/>`;
      const spokes = pts
        .map(([x, y], i) => {
          const [ex, ey] = polar(
            50,
            50,
            r + 10 + Math.floor(rng() * 8),
            i * 90
          );
          return (
            seg(x, y, ex, ey, i % 2 ? c2 : c1) +
            dot(ex, ey, 2.5, i % 2 ? c2 : c1)
          );
        })
        .join('');
      return `${diamond}${inner}${spokes}${dot(50, 50, 4)}`;
    }
  }
}
