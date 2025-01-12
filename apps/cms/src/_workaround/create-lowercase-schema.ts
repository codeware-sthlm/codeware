import { z } from 'zod';

type ZodShape = { [key: string]: z.ZodTypeAny };

/**
 * Type utility to convert schema keys to lowercase while preserving Zod types
 */
type LowercaseSchemaShape<T extends ZodShape> = {
  [K in keyof T as Lowercase<string & K>]: T[K];
};

/**
 * Creates a new schema with all keys in lowercase
 */
export function createLowercaseSchema<T extends z.ZodObject<ZodShape>>(
  schema: T
): z.ZodObject<LowercaseSchemaShape<T['shape']>> {
  const shape = schema.shape;
  const newShape: ZodShape = {};

  for (const [key, value] of Object.entries(shape)) {
    newShape[key.toLowerCase()] = value;
  }

  return z.object(newShape) as z.ZodObject<LowercaseSchemaShape<T['shape']>>;
}
