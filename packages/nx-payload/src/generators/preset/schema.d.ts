import { AppGeneratorSchema } from '../application/schema';

/**
 * Properties known up-front and handled by the preset.
 *
 * There could be more properties available from the CLI command,
 * which should be sent as is to the app generator.
 *
 * - `name` is provided when preset is used by `create-nx-payload` an contains the workspace name.
 *
 * - Application name and path are expected to be provided by either:
 *
 *   ```sh
 *   npx create-nx-payload
 *   ```
 *   _powered by `yargs` cli options_
 *
 *   or
 *
 *   ```sh
 *   npx create-nx-workspace --preset (at)cdwr/nx-payload
 *   ```
 *   _powered by preset `schema.json`_
 *
 */
export type PresetGeneratorSchema = Pick<AppGeneratorSchema, 'name'> & {
  /** Application name */
  payloadAppName: string;

  /** Application path */
  payloadAppDirectory: string;
};
