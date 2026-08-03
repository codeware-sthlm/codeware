import type { SiteSettingsFooter } from '@codeware/shared/util/payload-types';

import type { FieldComponentServer } from './component-types';

/**
 * Custom array row label for the footer links array field.
 *
 * Prints the link label instead of the default row label.
 */
export const FooterLinkArrayRowLabel: FieldComponentServer<'RowLabel'> = ({
  data,
  rowLabel,
  rowNumber
}) => {
  const fieldData = data as { footer?: SiteSettingsFooter };

  const currentIndex = (rowNumber ?? 0) - 1;
  const currentItem = fieldData.footer?.links?.[currentIndex];

  return currentItem?.link?.label || rowLabel;
};

export default FooterLinkArrayRowLabel;
