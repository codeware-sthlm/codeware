/**
 * On-demand database query profiler.
 *
 * Enabled with `PERF_PROFILE=true`. Drizzle reports every statement it runs,
 * which we aggregate by normalised shape — repeated identical queries are the
 * signal worth looking for, since Payload fans out access control and afterRead
 * hooks per collection per operation.
 *
 * Read the counters via `GET /api/perf-stats`.
 */

type ShapeStats = { count: number; sample: string };

/**
 * Survives dev HMR — module state would otherwise reset on every edit and
 * discard counters mid-investigation.
 */
const store = globalThis as unknown as {
  __cmsQueryStats?: {
    total: number;
    since: number;
    shapes: Map<string, ShapeStats>;
  };
};

const stats = (store.__cmsQueryStats ??= {
  total: 0,
  since: Date.now(),
  shapes: new Map()
});

/**
 * Collapse bind parameters, literals and numbers so that queries differing only
 * by argument land in the same bucket.
 */
function toShape(query: string): string {
  return query
    .replace(/\$\d+/g, '?')
    .replace(/'[^']*'/g, "'?'")
    .replace(/\b\d+\b/g, 'N')
    .replace(/\s+/g, ' ')
    .trim();
}

export function recordQuery(query: string): void {
  stats.total++;
  const shape = toShape(query);
  const existing = stats.shapes.get(shape);
  if (existing) {
    existing.count++;
  } else {
    stats.shapes.set(shape, { count: 1, sample: query.slice(0, 500) });
  }
}

export function resetQueryStats(): void {
  stats.total = 0;
  stats.since = Date.now();
  stats.shapes.clear();
}

export function readQueryStats(limit = 20) {
  const shapes = [...stats.shapes.entries()]
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, limit)
    .map(([shape, { count, sample }]) => ({ count, shape, sample }));

  return {
    total: stats.total,
    distinctShapes: stats.shapes.size,
    windowMs: Date.now() - stats.since,
    shapes
  };
}

/**
 * Drizzle logger wired into the Payload postgres adapter when profiling is on.
 */
export const queryStatsLogger = {
  logQuery: (query: string) => recordQuery(query)
};
