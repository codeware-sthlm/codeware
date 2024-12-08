import { z } from 'zod';

export type SchemaMetadata = {
  /**
   * A name that identifies the schema.
   *
   * Recommended to use the schema name as the identifier.
   */
  name: string;

  /**
   * The schema to register against the fixture key
   */
  schema: z.ZodTypeAny;

  /**
   * Tags for grouping related schemas in the test report
   */
  tags?: Array<string>;
};

/**
 * A registry for storing schema metadata for automated testing.
 *
 * Use `createSchemaTests` to run all registered schemas against their fixture data.
 */
export class SchemaRegistry {
  private static registry = new Map<string, SchemaMetadata>();
  /**
   * Registers a schema against a fixture key.
   *
   * The fixture key should represent where to find the fixture data.
   * For example, you have a fixture named `fly-app.json` that contains
   * api data matching the schema.
   *
   * The fixture is stored in `{fixtures}/api/fly-app.json`,
   * hence the fixture key for this schema would be `api/fly-app`.
   *
   * @param fixtureKey - The fixture key to register the schema against
   * @param schema - The schema to register
   * @param metadata - The metadata for the schema
   *
   * @example
   *
   * ```ts
   * // app.schema.ts
   * // Create a schema that is used in your
   * // application or library
   * const AppSchema = z.object({
   *   name: z.string(),
   *   region: z.string()
   * });
   *
   * // schemas.spec.ts
   * // Register the schema against a fixture key
   * // to enable automated schema validation.
   * // Tag `api` to group related schemas in the test report.
   * SchemaRegistry.register('api/fly-app', AppSchema, {
   *   name: 'Fly app',
   *   tags: ['api']
   * });
   * ```
   */
  static register(
    fixtureKey: string,
    schema: z.ZodTypeAny,
    metadata: Omit<SchemaMetadata, 'schema'>
  ) {
    this.registry.set(fixtureKey, { schema, ...metadata });
  }

  static get(fixtureKey: string): SchemaMetadata | undefined {
    return this.registry.get(fixtureKey);
  }

  static getByTag(tag: string): Array<[string, SchemaMetadata]> {
    return Array.from(this.registry.entries()).filter((entry) =>
      entry[1].tags?.includes(tag)
    );
  }

  static getAll(): Array<[string, SchemaMetadata]> {
    return Array.from(this.registry.entries());
  }
}
