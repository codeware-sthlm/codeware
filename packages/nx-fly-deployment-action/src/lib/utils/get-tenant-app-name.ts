/**
 * Get the name of the app for a given base app name and tenant ID
 *
 * Pattern: `<base-app-name>-<tenant-id>`
 *
 * @param baseAppName - The base name of the app from fly.toml
 * @param tenantId - The tenant ID
 * @returns The name of the tenant-specific app
 */
export const getTenantAppName = (baseAppName: string, tenantId: string) => {
  return `${baseAppName}-${tenantId}`;
};
