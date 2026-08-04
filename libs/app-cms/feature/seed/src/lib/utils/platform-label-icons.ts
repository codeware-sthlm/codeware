import type { PlatformLabel } from '@codeware/shared/util/payload-types';

type LabelType = PlatformLabel['type'];

/**
 * Icons for the labels the seed creates.
 *
 * Only a starting point — the icon is a field on the label, so a system user
 * changes it in the admin without touching code.
 */
const ICONS: Record<string, string> = {
  'place-kind:winery': 'BuildingStorefrontIcon',
  'place-kind:hotel': 'HomeModernIcon',
  'place-kind:restaurant': 'CakeIcon',
  'place-kind:activity': 'MapIcon',
  'place-kind:other': 'MapPinIcon'
};

/** Fallback per type, so a label always has an icon */
const FALLBACK: Record<LabelType, string> = {
  'place-kind': 'MapPinIcon',
  'stock-subject': 'PhotoIcon'
};

/** Split a `type:name` key back into its parts. */
export const splitLabelKey = (key: string): [LabelType, string] => {
  const separator = key.indexOf(':');
  return [key.slice(0, separator) as LabelType, key.slice(separator + 1)];
};

/** Stable order so seed logs and ids do not depend on object iteration. */
export const usedLabelsSorted = (keys: Array<string>): Array<string> =>
  [...keys].sort();

/** Resolve the icon for a seeded label. */
export const labelIcon = (type: LabelType, name: string): string =>
  ICONS[`${type}:${name}`] ?? FALLBACK[type];
