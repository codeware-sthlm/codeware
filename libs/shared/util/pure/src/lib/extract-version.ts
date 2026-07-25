/**
 * A version spec and its extracted numeric parts.
 */
export type VersionParts = {
  /** The raw spec, e.g. `~6.0.3`. */
  version: string;
  /** Leading major, e.g. `6`. `undefined` when the spec has no number. */
  major: number | undefined;
  /** Minor, e.g. `0`. `undefined` when absent. */
  minor: number | undefined;
  /** Patch, e.g. `3`. `undefined` when absent. */
  patch: number | undefined;
};

/**
 * Extract the numeric parts from a version spec or range string.
 *
 * The first `major.minor.patch` sequence is used, so a range operator
 * (`~6.0.3`, `^5.9.0`, `>=5.4.0`) is handled, but exotic specs (git URLs,
 * `npm:` aliases, `workspace:*`) may not yield meaningful parts - they come
 * back as `undefined` while `version` still holds the raw spec.
 *
 * @param version - A version spec/range string.
 * @returns The raw spec with its extracted parts.
 */
export const extractVersion = (version: string): VersionParts => {
  const [, major, minor, patch] =
    version.match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/) ?? [];

  const toNumber = (part: string | undefined): number | undefined =>
    part === undefined ? undefined : Number(part);

  return {
    version,
    major: toNumber(major),
    minor: toNumber(minor),
    patch: toNumber(patch)
  };
};
