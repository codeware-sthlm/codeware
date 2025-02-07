/**
 * TODO: Could be moved back to a package once `@cdwr/core` is split into more specific packages.
 *
 * Using something from core makes the bundle bloated with code you don't need.
 *
 * Since this zod preprocessor is used implicit by `web` app it has been placed here
 * for better separation of concerns.
 */

import { z } from 'zod';

type Options = {
  /**
   * The default value to use if the environment variable is not found.
   *
   * Never used if `throwOnMissing` is `true`.
   */
  defaultValue?: string;
  /**
   * The prefix to append when looking up the environment variable.
   */
  prefix?: string;
  /**
   * Throw an error if the environment variable is not found.
   *
   * Overrides `defaultValue`.
   */
  throwOnMissing?: boolean;
  /**
   * Treat `undefined` as an empty string.
   */
  undefinedIsEmpty?: boolean;
};

// Recursive function to process all nested values
const processData = (data: unknown, options: Required<Options>): unknown => {
  // Recurse process arrays
  if (Array.isArray(data)) {
    return data.map((item) => processData(item, options));
  }

  // Recurse transform objects
  if (data && typeof data === 'object' && data !== null) {
    return Object.entries(data).reduce((acc, [key, value]) => {
      return {
        ...acc,
        [key]: processData(value, options)
      };
    }, {});
  }

  // Main Process of string values
  if (data && typeof data === 'string' && data !== null) {
    const { defaultValue, prefix, throwOnMissing, undefinedIsEmpty } = options;

    return data.replace(/[\\$]?{([^}]+)}/g, (_, key) => {
      const fullKey = prefix + key;

      if (!(fullKey in process.env)) {
        if (throwOnMissing) {
          throw new Error(`Environment variable ${fullKey} not found`);
        }
        return defaultValue;
      }

      // String by design
      const value = String(process.env[fullKey]);

      if (value === 'undefined' && undefinedIsEmpty) {
        return '';
      }

      return value;
    });
  }

  return data;
};

/**
 * This preprocessor will replace all environment variables in the schema with the actual values from the environment.
 *
 * Environment variables are expected to be in the format of `${ENV_VAR_NAME}` or `{ENV_VAR_NAME}`.
 *
 * @param schema - The schema to transform.
 * @param options - The options for the preprocessor.
 * @returns The transformed schema.
 *
 * @example
 *
 * process.env.APP_API_URL = 'https://api.example.com';
 * process.env.APP_SECRET = 's3cre1';
 *
 * // Default usage
 * const schema = withEnvVars(
 *   z.object({
 *     apiUrl: z.string().url(),
 *     secret: z.string()
 *   })
 * );
 *
 * schema.parse({ apiUrl: '{APP_API_URL}', secret: '{APP_SECRET}' });
 * // { apiUrl: 'https://api.example.com', secret: 's3cre1' }
 *
 * // Lookup environment variables with a prefix
 * const schema = withEnvVars(
 *   z.object({
 *     apiUrl: z.string().url(),
 *     secret: z.string()
 *   }),
 *   {
 *     prefix: 'APP_'
 *   }
 * );
 *
 * schema.parse({ apiUrl: '{API_URL}', secret: 'no-secret' });
 * // { apiUrl: 'https://api.example.com', secret: 'no-secret' }
 *
 * // Throw an error if the environment variable is not found
 * const schema = withEnvVars(
 *   z.object({
 *     apiUrl: z.string().url(),
 *     secret: z.string()
 *   }),
 *   {
 *     throwOnMissing: true
 *   }
 * );
 *
 * schema.parse({ apiUrl: '{API_URL}', secret: 'no-secret' });
 * // Error: Environment variable API_URL not found
 *
 * // Use a default value if the environment variable is not found
 * const schema = withEnvVars(
 *   z.object({
 *     apiUrl: z.string().url(),
 *     secret: z.string()
 *   }),
 *   {
 *     defaultValue: 'http://localhost:3000'
 *   }
 * );
 *
 * schema.parse({ apiUrl: '{API_URL}', secret: 'no-secret' });
 * // { apiUrl: 'http://localhost:3000', secret: 'no-secret' }
 *
 * // Apply to only one property
 * const schema = z.object({
 *   apiUrl: z.string().url(),
 *   secret: withEnvVars(z.string(), { prefix: 'APP_' })
 * });
 *
 * schema.parse({ apiUrl: 'https://api.example.com', secret: '{SECRET}' });
 * // { apiUrl: 'https://api.example.com', secret: 's3cre1' }
 */
export const withEnvVars = <T extends z.ZodType>(
  schema: T,
  options: Options = {}
) => {
  const {
    defaultValue = '',
    prefix = '',
    throwOnMissing = false,
    undefinedIsEmpty = false
  } = options;

  return z.preprocess(
    (data) =>
      processData(data, {
        defaultValue,
        prefix,
        throwOnMissing,
        undefinedIsEmpty
      }),
    schema
  );

  // return data.replace(/[\\$]?{([^}]+)}/g, (_, key) => {
  //   const fullKey = prefix + key;

  //   if (!(fullKey in process.env)) {
  //     if (throwOnMissing) {
  //       throw new Error(`Environment variable ${fullKey} not found`);
  //     }
  //     return defaultValue;
  //   }

  //   // String by design
  //   const value = String(process.env[fullKey]);

  //   if (value === 'undefined' && undefinedIsEmpty) {
  //     return '';
  //   }

  //   return value;
  // });
  //  }, schema);
};
