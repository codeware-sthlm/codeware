import { FileItemContext } from '../types';

/**
 * Filter files on name and type based on case insensitive search string.
 *
 * @param files The files to filter.
 * @param search The search string.
 * @returns Filtered array of files.
 */
export const filterFiles = (files: Array<FileItemContext>, search: string) => {
  const lowercaseSearch = search.trim().toLowerCase();

  if (!lowercaseSearch) {
    return files;
  }

  return files.filter(
    ({ name, type }) =>
      name.toLowerCase().includes(lowercaseSearch) ||
      type.toLowerCase().includes(lowercaseSearch)
  );
};
