/**
 * Payload version which is in sync with all plugins.
 */
export const payloadVersion = '~3.69.0';

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
