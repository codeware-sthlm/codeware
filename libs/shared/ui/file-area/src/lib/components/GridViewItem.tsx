import { AspectRatio } from '@codeware/shared/ui/shadcn/components/aspect-ratio';

import { useFileArea } from '../FileAreaContext';
import type { BaseProps } from '../types';
import { formatFileSize } from '../utils/format-file.size';
import { getFileIcon } from '../utils/get-file-icon';

/**
 * File item component for grid view mode.
 */
export const GridViewItem = ({ file }: BaseProps) => {
  const { selectFile } = useFileArea();

  const FileIcon = getFileIcon(file.type);

  return (
    <div
      className="group bg-card cursor-pointer overflow-hidden rounded-lg border transition-all hover:shadow-md"
      onClick={() => selectFile(file)}
    >
      <AspectRatio ratio={1}>
        {file.type === 'image' ? (
          <div className="relative h-full w-full overflow-hidden">
            <img
              src={file.previewUrl}
              alt={file.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="bg-border flex h-full w-full items-center justify-center">
            <FileIcon className="size-8 transition-transform group-hover:scale-120" />
          </div>
        )}
      </AspectRatio>
      <div className="truncate p-2">
        <div className="text-secondary-foreground truncate" title={file.name}>
          {file.name}
        </div>
        <div className="flex justify-between text-xs">
          <span>{formatFileSize(file.size)}</span>
          <span>{file.type}</span>
        </div>
      </div>
    </div>
  );
};
