import {
  FileAudioIcon,
  FileIcon,
  FileImageIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileVideoIcon,
  PresentationIcon
} from 'lucide-react';

import type { FileType } from '../types';

/**
 * Get the icon component for a file type.
 *
 * @param fileType - The type of the file.
 * @returns A component matching the file type.
 *
 */
export const getFileIcon = (fileType: FileType) => {
  switch (fileType) {
    case 'image':
      return FileImageIcon;
    case 'video':
      return FileVideoIcon;
    case 'audio':
      return FileAudioIcon;
    case 'pdf':
      return FileTextIcon;
    case 'document':
      return FileTextIcon;
    case 'spreadsheet':
      return FileSpreadsheetIcon;
    case 'presentation':
      return PresentationIcon;
    default:
      return FileIcon;
  }
};
