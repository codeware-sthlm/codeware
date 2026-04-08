import type { TypedLocale } from 'payload';

import { getPage, getPost } from '@codeware/app-cms/data-access';
import type { Navigation } from '@codeware/shared/util/payload-types';

import type { FieldComponentServer } from './component-types';

/**
 * Custom array row label server component for the Navigation collection.
 *
 * Prints the name of the referenced page or post, or a custom label if provided, instead of the default row label.
 */
export const NavigationArrayRowLabel: FieldComponentServer<
  'RowLabel'
> = async ({ data, i18n: { language }, payload, rowLabel, rowNumber }) => {
  const fieldData = data as Navigation;
  const locale = language as TypedLocale;

  const currentIndex = (rowNumber ?? 0) - 1;
  const currentItem = fieldData.items?.[currentIndex];

  if (!currentItem) {
    return rowLabel;
  }

  const {
    customLabel,
    labelSource,
    reference: { relationTo, value: itemValue }
  } = currentItem;

  // Use custom label when available
  if (labelSource === 'custom' && customLabel) {
    return customLabel;
  }

  let label: string | undefined;

  // Check reference to pages
  if (relationTo === 'pages') {
    if (typeof itemValue === 'object') {
      label = itemValue.name;
    } else {
      label = (await getPage(payload, itemValue, { locale }))?.name;
    }
  }
  // Check reference to posts
  else if (relationTo === 'posts') {
    if (typeof itemValue === 'object') {
      label = itemValue.title;
    } else {
      label = (await getPost(payload, itemValue, { locale }))?.title;
    }
  }

  // Fallback to default row label
  return label || rowLabel;
};

export default NavigationArrayRowLabel;
