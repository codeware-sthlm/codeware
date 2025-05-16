/**
 * File area item properties
 */
export type FileItem = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  dateAdded: Date;
  previewUrl: string;
};

/**
 * @internal
 * File types
 */
export type FileType =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'other';

/**
 * @internal
 *  File item context properties
 */
export type FileItemContext = FileItem & {
  type: FileType;
};

/**
 * @internal
 * File area view mode
 */
export type ViewMode = 'list' | 'grid';

/**
 * @internal
 * File area sort options
 */
export type SortOption =
  | 'nameAsc'
  | 'nameDesc'
  | 'dateNewest'
  | 'dateOldest'
  | 'sizeSmallest'
  | 'sizeLargest';

/**
 * @internal
 * Component base properties
 */
export type BaseProps = {
  file: FileItemContext;
};
