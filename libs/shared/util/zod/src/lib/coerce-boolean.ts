import { z } from 'zod';

/**
 * Zod schema to coerce string values to boolean.
 *
 * - Strings equal to 'true' (case-insensitive) are converted to true.
 * - Strings equal to 'false' (case-insensitive) are converted to false.
 * - Actual boolean values are preserved.
 * - Null, undefined, and all other non-string, non-boolean values are coerced to false.
 */
export const coerceBoolean = z.preprocess((val) => {
  if (typeof val === 'boolean') {
    return val;
  }
  if (typeof val === 'string') {
    return val.trim().toLowerCase() === 'true';
  }

  // Coerce null/undefined and all other non-string, non-boolean values to false.
  if (val == null) {
    return false;
  }

  return false;
}, z.boolean());
