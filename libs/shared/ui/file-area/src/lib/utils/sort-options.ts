import type { TranslationKey } from '@codeware/shared/util/i18n';
import { Calendar, FileDown, FileUp, SortAsc, SortDesc } from 'lucide-react';

import type { SortOption } from '../types';

export const sortOptions: Array<{
  value: SortOption;
  translationKey: TranslationKey;
  Icon: React.ElementType;
}> = [
  {
    value: 'nameAsc',
    translationKey: 'fileArea.sortNameAsc',
    Icon: SortAsc
  },
  {
    value: 'nameDesc',
    translationKey: 'fileArea.sortNameDesc',
    Icon: SortDesc
  },
  {
    value: 'dateNewest',
    translationKey: 'fileArea.sortDateNewest',
    Icon: Calendar
  },
  {
    value: 'dateOldest',
    translationKey: 'fileArea.sortDateOldest',
    Icon: Calendar
  },
  {
    value: 'sizeSmallest',
    translationKey: 'fileArea.sortSizeSmallest',
    Icon: FileUp
  },
  {
    value: 'sizeLargest',
    translationKey: 'fileArea.sortSizeLargest',
    Icon: FileDown
  }
];
