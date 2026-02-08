import { FileType } from '../types';

/**
 * Extract the file type from the MIME type.
 *
 * @param mimeType - The MIME type of the file.
 * @returns The file type.
 */
export const extractFileType = (mimeType: string): FileType => {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  if (mimeType.startsWith('video/')) {
    return 'video';
  }
  if (mimeType.startsWith('audio/')) {
    return 'audio';
  }
  if (mimeType.includes('pdf')) {
    return 'pdf';
  }
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return 'document';
  }
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    return 'spreadsheet';
  }
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
    return 'presentation';
  }
  return 'other';
};
