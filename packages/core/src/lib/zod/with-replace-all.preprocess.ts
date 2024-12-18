import { z } from 'zod';

type Options = {
  /**
   * The string to match
   */
  match: string;
  /**
   * The value to replace the matched string with
   */
  value: string | number | undefined | null;
  /**
   * Whether to require a valid value to perform the replacement.
   *
   * Use this to prevent replacing an undefined value with empty string.
   *
   * @default false
   */
  strict?: boolean;
};

/**
 * A Zod preprocessor that replaces all occurrences of a string with a new value.
 *
 * @example
 *
 * ```ts
 * const schema = z.string();
 *
 * const transformed = withReplaceAll(schema, {
 *   match: 'foo', value: 'bar'
 * });
 * ```
 */
export const withReplaceAll = <T extends z.ZodType>(
  schema: T,
  options: Options
) => {
  const { match, value, strict = false } = options;

  return z.preprocess((data) => {
    if (typeof data !== 'string') {
      return data;
    }
    if (strict && !value) {
      return data;
    }
    return data.replaceAll(match, value?.toString() ?? '');
  }, schema);
};
