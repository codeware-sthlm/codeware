import { readFile } from 'fs/promises';

/**
 * Checks if GraphQL is disabled in a Payload config file.
 *
 * @param configFilePath - Path to the Payload config file
 * @returns Promise resolving to true if GraphQL is disabled, false otherwise
 */
export const isGraphQLDisabled = async (
  configFilePath: string
): Promise<boolean> => {
  try {
    const configContent = await readFile(configFilePath, 'utf-8');

    // Remove single-line comments to avoid false positives
    const contentWithoutComments = configContent.replace(/\/\/.*$/gm, '');

    // Match graphQL config with disable: true
    // Pattern allows disable property to appear anywhere in the graphQL object
    // Handles various formatting: spaces, newlines, with/without trailing commas
    // [\s\S]* matches any character including newlines
    const pattern = /graphQL:\s*\{[\s\S]*?disable:\s*true[\s\S]*?\}/;
    return pattern.test(contentWithoutComments);
  } catch (error) {
    // If we can't read the file or parse it, assume GraphQL is not disabled
    // This prevents the plugin from breaking due to file system errors
    console.warn(
      `Failed to check GraphQL status in ${configFilePath}:`,
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
};
