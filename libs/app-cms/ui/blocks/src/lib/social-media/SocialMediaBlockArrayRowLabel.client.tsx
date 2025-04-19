'use client';

import {
  SocialIcon,
  getSocialIconName
} from '@codeware/shared/ui/react-universal-components';
import type { SocialMediaBlockSocial } from '@codeware/shared/util/payload-types';
import { type RowLabelProps, useRowLabel } from '@payloadcms/ui';

/**
 * Custom array row label for social media block platforms array field.
 *
 * Displays the social media icon and platform name instead of the default row number.
 */
export const SocialMediaBlockArrayRowLabel: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<SocialMediaBlockSocial>();
  const { platform } = data ?? {};

  if (platform) {
    return (
      <div className="flex items-center gap-2">
        <SocialIcon platform={platform} />
        <span className="text-muted-foreground">
          {getSocialIconName(platform)}
        </span>
      </div>
    );
  }

  // TODO: Language support
  return `Social Media ${String(rowNumber).padStart(2, '0')}`;
};

export default SocialMediaBlockArrayRowLabel;
