/** Format a number to 2 decimal places for SVG attribute strings */
export function f(n: number) {
  return n.toFixed(2);
}

/** Convert polar coordinates (degrees) to Cartesian [x, y] */
export function polar(
  cx: number,
  cy: number,
  r: number,
  deg: number
): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/** Build SVG polygon points string for a regular n-sided polygon */
export function polyPoints(
  cx: number,
  cy: number,
  r: number,
  n: number,
  rotDeg = 0
) {
  return Array.from({ length: n }, (_, i) => {
    const [x, y] = polar(cx, cy, r, rotDeg + (360 / n) * i);
    return `${f(x)},${f(y)}`;
  }).join(' ');
}

/** Build SVG polygon points string for a star with outer/inner radii */
export function starPoints(
  cx: number,
  cy: number,
  ro: number,
  ri: number,
  n: number,
  rotDeg = 0
) {
  return Array.from({ length: n * 2 }, (_, i) => {
    const a = (Math.PI * i) / n + (rotDeg * Math.PI) / 180;
    const r = i % 2 === 0 ? ro : ri;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

/** Build an SVG arc path segment (move to start, arc to end) */
export function arcSeg(
  cx: number,
  cy: number,
  r: number,
  a1: number,
  a2: number,
  sweep = 1
) {
  const [x1, y1] = polar(cx, cy, r, a1),
    [x2, y2] = polar(cx, cy, r, a2);
  return `M ${f(x1)},${f(y1)} A ${r},${r} 0 ${Math.abs(a2 - a1) > 180 ? 1 : 0} ${sweep} ${f(x2)},${f(y2)}`;
}

/** Build an SVG pie-sector path (center → start → arc → close) */
export function sectorPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  sweepDeg: number
) {
  const s = (startDeg * Math.PI) / 180,
    e = ((startDeg + sweepDeg) * Math.PI) / 180;
  return `M ${cx} ${cy} L ${(cx + r * Math.cos(s)).toFixed(2)} ${(cy + r * Math.sin(s)).toFixed(2)} A ${r} ${r} 0 ${sweepDeg > 180 ? 1 : 0} 1 ${(cx + r * Math.cos(e)).toFixed(2)} ${(cy + r * Math.sin(e)).toFixed(2)} Z`;
}

/** Linear interpolation between a and b at fraction t */
export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
