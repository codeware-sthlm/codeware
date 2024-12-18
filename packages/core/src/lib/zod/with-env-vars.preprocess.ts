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
 *
 * // Default usage
 * const schema = z.object({
 *   apiUrl: withEnvVars(z.string().url())
 * });
 *
 * schema.parse({ apiUrl: '{APP_API_URL}' });
 * // { apiUrl: 'https://api.example.com' }
 *
 * // Lookup environment variables with a prefix
 * const schema = z.object({
 *   apiUrl: withEnvVars(z.string().url(), {
 *     prefix: 'APP_'
 *   })
 * });
 *
 * schema.parse({ apiUrl: '{API_URL}' });
 * // { apiUrl: 'https://api.example.com' }
 *
 * // Throw an error if the environment variable is not found
 * const schema = z.object({
 *   apiUrl: withEnvVars(z.string().url(), {
 *     throwOnMissing: true
 *   })
 * });
 *
 * schema.parse({ apiUrl: '{API_URL}' });
 * // Error: Environment variable API_URL not found
 *
 * // Use a default value if the environment variable is not found
 * const schema = z.object({
 *   apiUrl: withEnvVars(z.string().url(), {
 *     defaultValue: 'http://localhost:3000'
 *   })
 * });
 *
 * schema.parse({ apiUrl: '{API_URL}' });
 * // { apiUrl: 'http://localhost:3000' }
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

  return z.preprocess((val) => {
    if (typeof val !== 'string') {
      return val;
    }

    return val.replace(/[\\$]?{([^}]+)}/g, (_, key) => {
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
  }, schema);
};
