import { computeUpdatedVersionPattern } from './compute-updated-version-pattern';

/** Regex to match Nx package names */
const PKG = '(?:create-nx-workspace|nx|@nx\\/[^"]*)';

/** Regex to capture package name and version spec */
const CAPTURE = new RegExp(`"(?<name>${PKG})":\\s*"(?<spec>[^"]+)"`, 'g');

/**
 * Updates all matching package specs inside a package.json string.
 * Works for dependencies/devDependencies/peerDependencies/etc.
 *
 * @param jsonText The full package.json content as text
 * @param latestVersion The latest version to update to
 * @returns The updated package.json content as text
 */
export function updateDependencies(
  jsonText: string,
  latestVersion: string
): string {
  return jsonText.replace(
    CAPTURE,
    // replacer signature: (match, ...captures, offset, fullString, groups)
    // Extract package name and version spec from `CAPTURE` groups
    (full, name, spec) => {
      // Compute updated version spec
      const updated = computeUpdatedVersionPattern(spec, latestVersion);

      // If the updated version is the same as the original, return the full match
      // Otherwise, return the updated package spec
      return updated === spec ? full : `"${name}": "${updated}"`;
    }
  );
}
