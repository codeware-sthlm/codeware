import { readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Media file names expected to be available remotely for seeding.
 */
const remoteMediaFiles = [
  'abstract-image-1.png',
  'abstract-image-2.png',
  'abstract-image-3.png',
  'abstract-image-4.png',
  'data-1.json',
  'data-2.json',
  'document-1.pdf',
  'document-2.pdf',
  'text-1.txt',
  'text-2.txt',
  'word-1.docx',
  'word-2.docx'
] as const;

/**
 * Reads media files either from a remote URL
 * or from the local 'media' directory.
 */
export const readMediaFiles = (
  remoteDataUrl: string | undefined
): { filePath: string; filename: string }[] => {
  if (remoteDataUrl) {
    // Construct remote media file URLs
    return remoteMediaFiles.map((filename) => {
      return {
        filePath: path.join(remoteDataUrl, filename),
        filename
      };
    });
  }

  // Fallback: Read local media files from the 'media' directory
  const filename = fileURLToPath(import.meta.url);
  const dirname = path.dirname(filename);

  return readdirSync(path.resolve(dirname, 'media'), {
    encoding: 'utf-8',
    recursive: false,
    withFileTypes: true
  })
    .filter((file) => file.isFile())
    .map(({ name, parentPath }) => {
      return {
        filePath: path.resolve(parentPath, name),
        filename: name
      };
    });
};
