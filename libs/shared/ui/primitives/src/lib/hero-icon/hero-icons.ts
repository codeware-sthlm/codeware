import * as HeroIcons from '@heroicons/react/20/solid';

/** Heroicon name */
export type HeroIconName = keyof typeof HeroIcons;

type Icon = {
  /** Name of the component */
  name: HeroIconName;

  /** A more human-friendly name */
  friendlyName: string;

  /** Heroicon component */
  Component: React.FC<React.ComponentPropsWithoutRef<'svg'>>;
};

const heroIconNames = Object.keys(HeroIcons) as Array<HeroIconName>;

/**
 * A list of heroicon names and corresponding components.
 */
export const heroIcons: Array<Icon> = heroIconNames.map((icon) => ({
  name: icon,
  // Split the icon name at capital letters and join them with a space
  friendlyName: icon.match(/[A-Z][a-z]+/g)?.join(' ') ?? icon,
  Component: HeroIcons[icon]
}));

/**
 * A map of heroicon names and corresponding components.
 *
 * Used for a performant component lookup from icon name.
 */
export const heroIconMap = heroIcons.reduce(
  (acc, { name, friendlyName, Component }) => {
    acc[name] = { name, friendlyName, Component };
    return acc;
  },
  {} as Record<HeroIconName, Icon>
);
