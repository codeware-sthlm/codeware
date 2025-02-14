/**
 * Payload plugin targets.
 *
 * These targets are dedicated to Payload actions and developer experience.
 *
 * **Note:** `generate` is aliased to `gen` to avoid conflict with native `nx generate`.
 */
export const payloadTargets = [
  'gen',
  'payload',
  'payload-graphql',
  'dx:mongodb',
  'dx:postgres',
  'dx:start',
  'dx:stop'
] as const;

/**
 * Payload plugin targets.
 *
 * These targets are dedicated to Payload actions and developer experience.
 *
 * **Note:** `generate` is aliased to `gen` to avoid conflict with native `nx generate`.
 */
export type PayloadTarget = (typeof payloadTargets)[number];
