import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState
} from 'react';

import type { FileItem, FileItemContext, SortOption, ViewMode } from './types';
import { extractFileType } from './utils/extract-file-type';

type FileAreaContextType = {
  files: Array<FileItemContext>;
  viewMode: ViewMode;
  sortOption: SortOption;
  searchQuery: string;
  selectedFile: FileItemContext | null;
  setViewMode: (mode: ViewMode) => void;
  setSortOption: (option: SortOption) => void;
  setSearchQuery: (query: string) => void;
  selectFile: (file: FileItemContext | null) => void;
};

const FileAreaContext = createContext<FileAreaContextType | undefined>(
  undefined
);

export const FileAreaProvider = ({
  children,
  files
}: {
  children: ReactNode;
  files: Array<FileItem>;
}) => {
  //  const [files, setFiles] = useState<Array<FileItemContext>>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOption, setSortOption] = useState<SortOption>('dateNewest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileItemContext | null>(
    null
  );

  const selectFile = useCallback((file: FileItemContext | null) => {
    setSelectedFile(file);
  }, []);

  const filesExtended = files.map((file) => ({
    ...file,
    type: extractFileType(file.mimeType)
  }));

  const value = {
    files: filesExtended,
    viewMode,
    sortOption,
    searchQuery,
    selectedFile,
    setViewMode,
    setSortOption,
    setSearchQuery,
    selectFile
  };

  return (
    <FileAreaContext.Provider value={value}>
      {children}
    </FileAreaContext.Provider>
  );
};

export const useFileArea = () => {
  const context = useContext(FileAreaContext);
  if (context === undefined) {
    throw new Error('useFileArea must be used within a FileAreaProvider');
  }
  return context;
};
