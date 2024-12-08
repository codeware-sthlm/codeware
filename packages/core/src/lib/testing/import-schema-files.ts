import fg from 'fast-glob';

/**
 * @internal
 * Imports all schema files in the given directory to trigger registration.
 *
 * @param schemaDir - Absolute path to the directory containing the schema files
 */
export const importSchemaFiles = async (schemaDir: string) => {
  const schemaFiles = await fg(['**/**.schema.ts'], {
    cwd: schemaDir,
    absolute: true
  });

  // Import all schema files to trigger registration
  await Promise.all(schemaFiles.map((file) => import(file)));
};
