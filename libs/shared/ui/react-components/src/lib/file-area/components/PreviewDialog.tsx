import { Button } from '@codeware/shared/ui/shadcn/components/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@codeware/shared/ui/shadcn/components/dialog';
import { Calendar, Download, Scale } from 'lucide-react';

import { useFileArea } from '../FileAreaContext';
import { downloadFile } from '../utils/download-file';
import { formatDate } from '../utils/format-date';
import { formatFileSize } from '../utils/format-file.size';
import { getFileIcon } from '../utils/get-file-icon';

/**
 * Preview component that opens a dialog with file details
 * when a file is selected.
 */
export const PreviewDialog = () => {
  const { selectedFile, selectFile } = useFileArea();

  if (!selectedFile) return null;

  const FileIcon = getFileIcon(selectedFile.type);

  return (
    <Dialog
      open={!!selectedFile}
      onOpenChange={(open) => !open && selectFile(null)}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="truncate">{selectedFile.name}</DialogTitle>
        </DialogHeader>

        {(selectedFile.type === 'image' && (
          <div className="bg-border flex max-h-96 items-center justify-center overflow-hidden rounded-lg p-4">
            <img
              src={selectedFile.previewUrl}
              alt={selectedFile.name}
              className="max-h-full max-w-full rounded object-contain shadow-sm"
            />
          </div>
        )) || (
          <div className="bg-border flex flex-col items-center justify-center rounded-lg p-16">
            <FileIcon className="mb-4 size-16" />
            <p className="text-center">
              Preview not available for this file type
            </p>
          </div>
        )}

        <div className="mt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <div className="flex items-center">
              <Calendar className="mr-2 size-4" />
              <span>{formatDate(selectedFile.dateAdded)}</span>
            </div>
            <div className="flex items-center">
              <Scale className="mr-2 size-4" />
              <span>{formatFileSize(selectedFile.size)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="cursur-pointer w-full"
            onClick={(e) => downloadFile(e, selectedFile)}
          >
            <Download className="size-4" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
