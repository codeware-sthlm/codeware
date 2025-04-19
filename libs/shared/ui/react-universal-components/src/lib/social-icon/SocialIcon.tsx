import { cn } from '@codeware/shared/util/ui';
import type { ComponentPropsWithRef } from 'react';

import { type Platform, socialIconsMap } from './social-icons';

type SocialIconProps = {
  platform: Platform;
  size?: 'large' | 'regular' | 'small';
} & ComponentPropsWithRef<'svg'>;

/**
 * A universal component that renders a social icon.
 *
 * @param platform - The platform of the social icon.
 * @param size - The size of the social icon.
 * @param props - The props of the social icon.
 */
export const SocialIcon: React.FC<SocialIconProps> = ({
  className,
  platform,
  size = 'regular',
  ...props
}) => {
  const Icon = socialIconsMap[platform];

  if (!Icon) {
    return null;
  }

  return (
    <Icon.Component
      className={cn(className, {
        'size-7': size === 'large',
        'size-6': size === 'regular',
        'size-5': size === 'small'
      })}
      {...props}
    />
  );
};
