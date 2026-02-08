import { cn } from '@codeware/shared/util/ui';

import { useFileArea } from '../FileAreaContext';
import type { BaseProps } from '../types';
import { formatDate } from '../utils/format-date';
import { formatFileSize } from '../utils/format-file.size';
import { getFileIcon } from '../utils/get-file-icon';

/**
 * File item component for list view mode.
 */
export const ListViewItem = ({
  className,
  file
}: BaseProps & { className?: string }) => {
  const { selectFile } = useFileArea();

  const FileIcon = getFileIcon(file.type);

  return (
    <div
      className={cn(
        'hover:bg-border flex cursor-pointer items-center justify-between p-3 transition-colors',
        className
      )}
      onClick={() => selectFile(file)}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <FileIcon className="size-5" />
        <div className="min-w-0 flex-1">
          <div
            className="text-secondary-foreground truncate font-semibold"
            title={file.name}
          >
            {file.name}
          </div>
          <div className="text-xs">
            {formatFileSize(file.size)} • {file.type}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden text-sm md:inline">
          {formatDate(file.dateAdded)}
        </span>
      </div>
    </div>
  );
};
