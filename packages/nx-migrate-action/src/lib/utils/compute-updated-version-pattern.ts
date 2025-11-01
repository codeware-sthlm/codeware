/**
 * Rewrites a dependency version spec to the desired target,
 * covering all version patterns:
 *
 * - Plain semver:  "21.2.3" -> "22.0.0"
 * - Major.x:       "21.x"   -> "22.x"
 * - Caret:         "^21.0.0" -> "^22.0.0"
 * - Ranges (||):   "^20.0.0 || ^21.0.0" -> "... || ^22.0.0" (if missing)
 *
 * Leaves other patterns ("~21.0.0", tags, URLs) unchanged.
 */
export const computeUpdatedVersionPattern = (
  spec: string,
  latestVersion: string
): string => {
  const latestMajor = latestVersion.split('.')[0];

  // 1) Multi-range: extend with latest (preserve spacing style around ||)
  if (spec.includes('||')) {
    const glue = spec.includes(' || ') ? ' || ' : '||';
    const parts = spec.split('||').map((p) => p.trim());
    const hasLatest = parts.some((p) =>
      new RegExp(`^\\^?${latestMajor}\\.`).test(p)
    );
    if (!hasLatest) return `${spec.trim()}${glue}^${latestVersion}`;
    return spec;
  }

  // 2) Caret: bump to ^latestVersion
  if (/^\^\d+\.\d+\.\d+$/.test(spec)) {
    return `^${latestVersion}`;
  }

  // 3) Major.x: bump to latestMajor.x
  if (/^\d+\.x$/.test(spec)) {
    return `${latestMajor}.x`;
  }

  // 4) Plain semver: bump to latestVersion
  if (/^\d+\.\d+\.\d+$/.test(spec)) {
    return `${latestVersion}`;
  }

  // 5) Everything else is not this pass's concern
  return spec;
};
