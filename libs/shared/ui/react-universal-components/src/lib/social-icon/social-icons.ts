import {
  SiDiscord,
  SiFacebook,
  SiGithub,
  SiInstagram,
  SiNpm,
  SiX,
  SiYoutube
} from '@icons-pack/react-simple-icons';
import { Globe } from 'lucide-react';

import { LinkedIn } from './svg/LinkedIn';

/** Social media platform */
export type Platform =
  | 'discord'
  | 'facebook'
  | 'github'
  | 'instagram'
  | 'linkedin'
  | 'npm'
  | 'web'
  | 'x'
  | 'youtube';

type Icon = {
  platform: Platform;
  name: string;
  Component: React.FC<React.ComponentPropsWithoutRef<'svg'>>;
};

/**
 * A map of social icon names and corresponding components.
 *
 * Used for a performant component lookup from icon name.
 */
export const socialIconsMap: Record<Platform, Icon> = {
  discord: {
    platform: 'discord',
    name: 'Discord',
    Component: SiDiscord
  },
  facebook: {
    platform: 'facebook',
    name: 'Facebook',
    Component: SiFacebook
  },
  github: {
    platform: 'github',
    name: 'GitHub',
    Component: SiGithub
  },
  instagram: {
    platform: 'instagram',
    name: 'Instagram',
    Component: SiInstagram
  },
  linkedin: {
    platform: 'linkedin',
    name: 'LinkedIn',
    Component: LinkedIn
  },
  npm: {
    platform: 'npm',
    name: 'npm',
    Component: SiNpm
  },
  web: {
    platform: 'web',
    name: 'Web',
    Component: Globe
  },
  x: {
    platform: 'x',
    name: 'X',
    Component: SiX
  },
  youtube: {
    platform: 'youtube',
    name: 'YouTube',
    Component: SiYoutube
  }
};

/**
 * Get the friendly name of a social icon.
 *
 * @param platform - The platform of the social icon.
 * @returns The friendly name of the social icon.
 */
export const getSocialIconName = (platform: Platform) =>
  socialIconsMap[platform].name;
