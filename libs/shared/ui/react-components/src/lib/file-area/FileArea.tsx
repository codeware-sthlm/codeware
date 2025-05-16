import { cn } from '@codeware/shared/util/ui';

import { PreviewDialog } from './components/PreviewDialog';
import { RenderFiles } from './components/RenderFiles';
import { Toolbar } from './components/Toolbar';
import { FileAreaProvider } from './FileAreaContext';
import type { FileItem } from './types';

type FileAreaProps = {
  files: Array<FileItem>;
} & React.HTMLAttributes<HTMLDivElement>;

export const FileArea = ({ className, files }: FileAreaProps) => {
  return (
    <FileAreaProvider files={files}>
      <div className={cn('flex w-full flex-col', className)}>
        <Toolbar />
        <RenderFiles />
      </div>
      <PreviewDialog />
    </FileAreaProvider>
  );
};
