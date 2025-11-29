/**
 * Payload version which is in sync with all plugins.
 *
 * Due to an issue for pnpm workspaces, we currently stay at 3.42.
 * https://github.com/payloadcms/payload/pull/12622
 */
export const payloadVersion = '~3.42.0';

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

export const testingLibraryDomVersion = '^10.0.0';
export const testingLibraryJestDomVersion = '^6.1.0';
export const testingLibraryReactVersion = '^16.1.0';
