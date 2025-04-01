import type { Navigation } from '@codeware/shared/util/payload-types';

import type { ArrayRowLabel } from './array-row-label.type';

/**
 * Custom array row label for the navigation array field.
 *
 * Displays the navigation item label instead of the default row number.
 */
export const NavigationArrayRowLabel: React.FC<ArrayRowLabel> = async (
  props
) => {
  const { payload, data, rowLabel, rowNumber } = props;
  const { items } = data as Navigation;

  // Get current nav item
  const navItem = (items ?? []).at((rowNumber ?? 0) - 1);

  if (!navItem?.reference) {
    return rowLabel;
  }

  const {
    customLabel,
    labelSource,
    reference: { relationTo, value }
  } = navItem;

  // Check custom label
  if (labelSource === 'custom') {
    return customLabel;
  }

  // Check reference to pages
  if (relationTo === 'pages') {
    if (typeof value === 'object') {
      return value.name;
    }
    const page = await payload.findByID({
      collection: 'pages',
      id: value,
      disableErrors: true
    });
    return page?.name ?? `Page #${value}`;
  }

  // Check reference to posts
  if (relationTo === 'posts') {
    if (typeof value === 'object') {
      return value.title;
    }
    const post = await payload.findByID({
      collection: 'posts',
      id: value,
      disableErrors: true
    });
    return post?.title ?? `Post #${value}`;
  }

  throw new Error('Invalid reference relation type');
};

export default NavigationArrayRowLabel;
