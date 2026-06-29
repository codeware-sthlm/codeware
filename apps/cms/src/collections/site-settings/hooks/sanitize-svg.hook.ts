import type { CollectionBeforeChangeHook } from 'payload';

import type { SiteSetting } from '@codeware/shared/util/payload-types';
import { sanitizeSvg } from '@codeware/shared/util/pure';

/**
 * Before change hook.
 *
 * Sanitize SVG code to prevent XSS attacks.
 *
 * @param data The data to populate
 * @returns The data with the `icon` field sanitized
 */
export const sanitizeSvgHook: CollectionBeforeChangeHook<SiteSetting> = ({
  data
}) => {
  const svgCode = data.general?.icon?.svgCode;
  if (!svgCode) {
    return data;
  }

  const sanitizedSvgCode = sanitizeSvg(svgCode);

  return {
    ...data,
    general: {
      ...data.general,
      icon: {
        ...data?.general?.icon,
        svgCode: sanitizedSvgCode
      }
    }
  };
};
