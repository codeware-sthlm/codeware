import { FileText } from 'lucide-react';
import { useMemo } from 'react';

import { useFileArea } from '../FileAreaContext';
import { filterFiles } from '../utils/filter-files';
import { sortFiles } from '../utils/sort-files';

import { GridViewItem } from './GridViewItem';
import { ListViewItem } from './ListViewItem';

/**
 * Renders the files in the file area.
 */
export const RenderFiles = () => {
  const { files, viewMode, sortOption, searchQuery } = useFileArea();

  const processedFiles = useMemo(
    () => sortFiles(filterFiles(files, searchQuery), sortOption),
    [files, sortOption, searchQuery]
  );

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-16 text-center">
        <FileText className="size-8" />
        <h3 className="text-lg">No files</h3>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {processedFiles.map((file) => (
          <GridViewItem key={file.id} file={file} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {processedFiles.map((file) => (
        <ListViewItem className="not-last:border-b" key={file.id} file={file} />
      ))}
    </div>
  );
};
