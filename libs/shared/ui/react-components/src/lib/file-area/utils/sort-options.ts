import { Calendar, FileUp, SortAsc, SortDesc } from 'lucide-react';

import type { SortOption } from '../types';

export const sortOptions: Array<{
  value: SortOption;
  label: string;
  Icon: React.ElementType;
}> = [
  {
    value: 'nameAsc',
    label: 'Name (A-Z)',
    Icon: SortAsc
  },
  {
    value: 'nameDesc',
    label: 'Name (Z-A)',
    Icon: SortDesc
  },
  {
    value: 'dateNewest',
    label: 'Newest first',
    Icon: Calendar
  },
  {
    value: 'dateOldest',
    label: 'Oldest first',
    Icon: Calendar
  },
  {
    value: 'sizeSmallest',
    label: 'Size (smallest)',
    Icon: FileUp
  },
  {
    value: 'sizeLargest',
    label: 'Size (largest)',
    Icon: FileUp
  }
];
