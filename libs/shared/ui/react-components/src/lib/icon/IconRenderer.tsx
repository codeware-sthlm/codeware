import React from 'react';

import { HeroIcon, heroIconMap } from './hero-icons';

/**
 * A universal component for rendering a heroicon.
 *
 * @param icon - The name of the heroicon to render.
 * @param rest - The rest of the props to pass to the heroicon component.
 */
export const IconRenderer = ({
  icon,
  ...rest
}: {
  icon: HeroIcon;
} & React.ComponentPropsWithoutRef<'svg'>) => {
  const IconComponent = heroIconMap[icon]?.Component;

  if (!IconComponent) {
    return null;
  }

  return <IconComponent data-slot="icon" {...rest} />;
};
