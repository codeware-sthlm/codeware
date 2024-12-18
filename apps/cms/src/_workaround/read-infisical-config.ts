import { readFile } from 'fs/promises';

import { findUpFs } from './find-up-fs';
import { ConfigSchema } from './infisical.schemas';

/**
 * Read the Infisical configuration file `.infisical.json`
 *
 * @returns The parsed Infisical configuration
 * @throws An error if the configuration file is not found or is not valid
 */
export const readInfisicalConfig = async () => {
  const filePath = await findUpFs('.infisical.json');
  if (!filePath) {
    throw new Error('Infisical configuration file not found');
  }
  const content = await readFile(filePath, 'utf-8');

  const jsonContent = JSON.parse(content);

  const parsed = ConfigSchema.safeParse(jsonContent);
  if (!parsed.success) {
    throw new Error('Invalid Infisical configuration file', {
      cause: parsed.error.flatten().fieldErrors
    });
  }

  return parsed.data;
};
