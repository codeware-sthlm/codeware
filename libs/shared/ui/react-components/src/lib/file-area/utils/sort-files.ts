import type { FileItemContext, SortOption } from '../types';

/**
 * Sort files based on sort option.
 *
 * @param files The file to sort.
 * @param sortOption Sort option to use.
 * @returns Sorted array of files.
 */
export const sortFiles = (
  files: Array<FileItemContext>,
  sortOption: SortOption
) => {
  return [...files].sort((a, b) => {
    switch (sortOption) {
      case 'nameAsc':
        return a.name.localeCompare(b.name);
      case 'nameDesc':
        return b.name.localeCompare(a.name);
      case 'dateNewest':
        return b.dateAdded.getTime() - a.dateAdded.getTime();
      case 'dateOldest':
        return a.dateAdded.getTime() - b.dateAdded.getTime();
      case 'sizeSmallest':
        return a.size - b.size;
      case 'sizeLargest':
        return b.size - a.size;
      default:
        return 0;
    }
  });
};
