/**
 * Server-only entry point for the domains feature.
 *
 * Everything reachable from `index.ts` ends up in the admin's client bundle,
 * because the domains panel is a client component that imports the barrel.
 * A `node:` builtin in that graph fails the browser build outright, so the
 * modules that need one are exported from here instead and imported only by
 * endpoints.
 */
export { compareResolvers } from './lib/compare-resolvers';
