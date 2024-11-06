/** Payload version */
export const payloadVersion = '^2.30.3';

/**
 * Payload plugins supported by the plugin setup
 * @link https://github.com/payloadcms/payload/tree/main/packages
 */
export const payloadPluginsVersions: Record<string, string> = {
  '@payloadcms/bundler-webpack': '^1.0.7',
  '@payloadcms/db-mongodb': '^1.7.3',
  '@payloadcms/db-postgres': '^0.8.9',
  '@payloadcms/richtext-slate': '^1.5.2'
};
