/**
 * Payload version which is also applied to all plugins for ESM workspaces.
 */
export const payloadESMVersion = '~3.69.0';

/**
 * Undici bug require Payload to stay at version 3.42 for CommonJS workspaces.
 * https://github.com/payloadcms/payload/issues/13290
 */
export const payloadCommonJSVersion = '~3.42.0';

/**
 * Next 15 version to install when missing.
 *
 * Currently Nx and Payload support Next 15, so we use that as the default,
 * to avoid early adopter issues with Next 16.
 *
 * @see https://github.com/nrwl/nx/blob/master/packages/next/src/utils/versions.ts
 */
export const next15Version = '~15.2.4';

export const graphqlVersion = '^16.10.0';
