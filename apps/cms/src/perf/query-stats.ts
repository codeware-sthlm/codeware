/**
 * Database query profiler for local development.
 *
 * The drizzle logger is installed on every dev boot but records nothing until
 * collection is started from `/api/perf-stats`, so there is no env var to set
 * and no restart needed to use it.
 *
 * Queries are bucketed by normalised shape — repeated identical shapes are the
 * signal worth looking for, since Payload fans out access control and afterRead
 * hooks per collection per operation.
 */

/** Repeats of a single shape within one window before we flag it in the log */
const REPEAT_WARN_THRESHOLD = 25;

type Stats = {
  collecting: boolean;
  total: number;
  since: number;
  shapes: Map<string, number>;
  warned: Set<string>;
};

/**
 * Survives dev HMR — module state would otherwise reset on every edit and
 * discard counters mid-investigation.
 */
const store = globalThis as unknown as { __cmsQueryStats?: Stats };

const stats = (store.__cmsQueryStats ??= {
  collecting: false,
  total: 0,
  since: Date.now(),
  shapes: new Map(),
  warned: new Set()
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

function recordQuery(query: string): void {
  if (!stats.collecting) {
    return;
  }

  stats.total++;
  const shape = toShape(query);
  const count = (stats.shapes.get(shape) ?? 0) + 1;
  stats.shapes.set(shape, count);

  // Surface runaway fan-out without needing anyone to poll the endpoint
  if (count === REPEAT_WARN_THRESHOLD && !stats.warned.has(shape)) {
    stats.warned.add(shape);
    console.warn(
      `[PERF] ${count} identical queries in this window: ${shape.slice(0, 160)}`
    );
  }
}

export function setCollecting(collecting: boolean): void {
  stats.collecting = collecting;
  if (collecting) {
    resetQueryStats();
  }
}

export function resetQueryStats(): void {
  stats.total = 0;
  stats.since = Date.now();
  stats.shapes.clear();
  stats.warned.clear();
}

export function readQueryStats(limit = 20) {
  const shapes = [...stats.shapes.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([shape, count]) => ({ count, shape }));

  return {
    collecting: stats.collecting,
    total: stats.total,
    distinctShapes: stats.shapes.size,
    windowMs: Date.now() - stats.since,
    shapes
  };
}

/**
 * Drizzle logger handed to the Payload postgres adapter on dev boots.
 */
export const queryStatsLogger = {
  logQuery: (query: string) => recordQuery(query)
};
