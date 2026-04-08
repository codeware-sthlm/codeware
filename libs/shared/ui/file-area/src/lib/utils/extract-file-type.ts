import type { TranslationKey } from '@codeware/shared/util/i18n';

import type { FileType } from '../types';

/**
 * Extract the file type from the MIME type.
 *
 * @param mimeType - The MIME type of the file.
 * @returns The file type and its corresponding translation key.
 */
export const extractFileType = (
  mimeType: string
): { type: FileType; translationKey: TranslationKey } => {
  if (mimeType.startsWith('image/')) {
    return { type: 'image', translationKey: 'fileArea.typeImage' };
  }
  if (mimeType.startsWith('video/')) {
    return { type: 'video', translationKey: 'fileArea.typeVideo' };
  }
  if (mimeType.startsWith('audio/')) {
    return { type: 'audio', translationKey: 'fileArea.typeAudio' };
  }
  if (mimeType.includes('pdf')) {
    return { type: 'pdf', translationKey: 'fileArea.typePdf' };
  }
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return { type: 'document', translationKey: 'fileArea.typeDocument' };
  }
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    return { type: 'spreadsheet', translationKey: 'fileArea.typeSpreadsheet' };
  }
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
    return {
      type: 'presentation',
      translationKey: 'fileArea.typePresentation'
    };
  }
  return { type: 'other', translationKey: 'fileArea.typeOther' };
};
