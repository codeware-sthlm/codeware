import { z } from 'zod';

/**
 * Coerce to boolean with a default value for empty/missing values.
 *
 * Useful for environment variables where empty strings should use the default.
 *
 * @param defaultValue - The default boolean value (true or false)
 * @returns Zod schema that coerces to boolean with the specified default
 *
 * @example
 * ```ts
 * const schema = z.object({
 *   FEATURE_FLAG: coerceBoolean(true)
 * });
 * // Missing or empty → true
 * // 'false' → false
 * ```
 */
export const coerceBoolean = (defaultValue: boolean) =>
  z
    .string()
    .transform((val) => (val === '' ? String(defaultValue) : val))
    .pipe(z.enum(['true', 'false']))
    .transform((val) => val === 'true');
