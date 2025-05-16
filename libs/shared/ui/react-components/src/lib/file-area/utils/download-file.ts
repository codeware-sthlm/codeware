import type { FileItem } from '../types';

// Best practice downloading a file?
export const downloadFile = (e: React.MouseEvent, file: FileItem) => {
  e.stopPropagation();
  const link = document.createElement('a');
  link.href = file.previewUrl;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
