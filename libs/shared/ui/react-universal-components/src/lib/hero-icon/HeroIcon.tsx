import { type TailwindColor, tailwind } from '@codeware/shared/util/tailwind';
import React from 'react';

import { type HeroIconName, heroIconMap } from './hero-icons';

/**
 * A universal component that renders a heroicon.
 *
 * @param icon - The name of the heroicon to render.
 * @param color - The Tailwind color name to apply to the icon.
 * @param rest - The rest of the props to pass to the heroicon component.
 */
export const HeroIcon = ({
  icon,
  color,
  ...rest
}: React.ComponentPropsWithoutRef<'svg'> & {
  icon: HeroIconName;
  color?: TailwindColor;
}) => {
  const IconComponent = heroIconMap[icon]?.Component;

  if (!IconComponent) {
    return null;
  }

  // Translate Tailwind color name to color code
  const colorCode = color ? tailwind.color(color) : undefined;

  return <IconComponent data-slot="icon" color={colorCode} {...rest} />;
};
