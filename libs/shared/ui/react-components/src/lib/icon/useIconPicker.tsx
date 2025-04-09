import React, { useMemo, useState } from 'react';

import { Icon, heroIcon } from './hero-icons';

type IconPicker = {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  icons: Array<Icon>;
};

/**
 * A client-side hook for collecting icon data.
 *
 * Has built-in search functionality.
 */
export const useIconPicker = (): IconPicker => {
  // State for the search input
  const [search, setSearch] = useState('');

  // Memoize the hero icon components
  const icons = useMemo(() => heroIcon, []);

  // Memoize the search functionality
  const filteredIcons = useMemo(() => {
    return icons.filter((icon) => {
      if (search === '') {
        return true;
      } else if (icon.name.toLowerCase().includes(search.toLowerCase())) {
        return true;
      } else {
        return false;
      }
    });
  }, [icons, search]);

  return { search, setSearch, icons: filteredIcons };
};
