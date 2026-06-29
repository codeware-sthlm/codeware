/** All available colour palette identifiers for solid and vibrant styles. */
export const SeedIconPalettes = [
  'warm',
  'cool',
  'mono',
  'pastel',
  'neon',
  'earth'
] as const;
/** All available corner-shape identifiers applied to the icon's bounding area. */
export const SeedIconShapes = ['sharp', 'soft', 'circular'] as const;
/** All available rendering style identifiers for a seed icon. */
export const SeedIconStyles = ['solid', 'vibrant', 'sketch', 'tech'] as const;
/** All available colour theme identifiers for the sketch style. */
export const SeedIconSketchThemes = [
  'current',
  'ink',
  'chalk',
  'slate',
  'cobalt',
  'forest',
  'wine',
  'ember',
  'violet'
] as const;
/** All available background theme identifiers for the tech style. */
export const SeedIconTechThemes = ['current', 'dark'] as const;

/** One of the named colour palettes available for solid/vibrant icons. */
export type SeedIconPalette = (typeof SeedIconPalettes)[number];
/** Corner-shape treatment applied to the icon's bounding rectangle. */
export type SeedIconShape = (typeof SeedIconShapes)[number];
/** Visual rendering style that determines the pattern family used for the icon. */
export type SeedIconStyle = (typeof SeedIconStyles)[number];
/** Foreground/background colour theme for sketch-style icons. */
export type SeedIconSketchTheme = (typeof SeedIconSketchThemes)[number];
/** Background theme for tech-style icons. */
export type SeedIconTechTheme = (typeof SeedIconTechThemes)[number];

/** Controls visual output of generateSeedIcon; omit any field to use the generator's defaults */
export type SeedIconOptions = {
  palette?: SeedIconPalette;
  shape?: SeedIconShape;
  style?: SeedIconStyle;
  sketchTheme?: SeedIconSketchTheme;
  techTheme?: SeedIconTechTheme;
};
