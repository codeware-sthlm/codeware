import { existsSync } from 'fs';

import { getId } from '@codeware/app-cms/util/misc';
import type { Media } from '@codeware/shared/util/payload-types';
import type { Payload } from 'payload';

export type MediaData = Pick<Media, 'alt' | 'external' | 'tags' | 'tenant'> & {
  filename: string;
  filePath: string;
};

/**
 * Ensure that a media file exists with the given filename from the file path.
 *
 * It's assumed that seeded file names are not reused across file types.
 * Otherwise images could be seeded multiple times and thus create duplicates.
 *
 * @param payload - Payload instance
 * @param transactionID - Transaction ID when supported by the database
 * @param data - Media data
 * @returns The created media file or the id if the media file exists
 */
export async function ensureMedia(
  payload: Payload,
  transactionID: string | number | undefined,
  data: MediaData
): Promise<Media | number> {
  const { alt, external, filename, filePath, tags, tenant } = data;

  if (!existsSync(filePath)) {
    throw new Error(`Media file does not exist: ${filePath}`);
  }

  // File names should be unique by design
  const filenameWithoutExtension = filename.replace(/\.[^/.]+$/, '');

  // Check if the media file exists with the given filename and tenant
  const media = await payload.find({
    collection: 'media',
    where: {
      and: [
        { filename: { contains: filenameWithoutExtension } },
        tenant ? { tenant: { in: [getId(tenant)] } } : {}
      ]
    },
    depth: 0,
    limit: 1,
    req: { transactionID }
  });

  if (media.totalDocs) {
    return media.docs[0].id;
  }

  // No media file found, create one by uploading the local file

  const mediaFile = await payload.create({
    collection: 'media',
    data: {
      alt,
      external,
      filename,
      tags,
      tenant
    },
    filePath,
    req: { transactionID }
  });

  return mediaFile;
}
