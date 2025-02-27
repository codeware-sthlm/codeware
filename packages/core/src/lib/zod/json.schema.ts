import { z } from 'zod';

const LiteralSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof LiteralSchema>;
type Json = Literal | { [key: string]: Json } | Json[];

/**
 * A schema for validating any JSON value
 *
 * @example
 * ```ts
 * try {
 *  const
 *   const value = JsonSchema.parse(data);
 * } catch (error) {
 *   console.log('Invalid JSON data');
 * }
 * ```
 */
export const JsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([LiteralSchema, z.array(JsonSchema), z.record(JsonSchema)])
);
