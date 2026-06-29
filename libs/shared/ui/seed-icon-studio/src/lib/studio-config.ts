import type { SeedIconPalette, SeedIconSketchTheme } from './types';

/** Word lists for the random-seed generator button */
export const ADJECTIVES = [
  'solar',
  'drift',
  'crest',
  'axiom',
  'forge',
  'lumen',
  'nova',
  'echo',
  'prism',
  'orbit',
  'veil',
  'apex',
  'mira',
  'fold',
  'atlas'
];
/** Word lists for the random-seed generator button */
export const NOUNS = [
  'studio',
  'labs',
  'works',
  'hq',
  'co',
  'io',
  'dev',
  'app',
  'ai',
  'hub',
  'base'
];

/** Palette picker options with gradient swatches for the sidebar UI */
export const PALETTE_OPTIONS: {
  value: SeedIconPalette | 'auto';
  label: string;
  swatch: string;
}[] = [
  {
    value: 'auto',
    label: 'Auto',
    swatch: 'linear-gradient(135deg,#6366f1,#ec4899,#f59e0b)'
  },
  {
    value: 'warm',
    label: 'Warm',
    swatch: 'linear-gradient(135deg,#b91c1c,#ea580c,#ca8a04)'
  },
  {
    value: 'cool',
    label: 'Cool',
    swatch: 'linear-gradient(135deg,#0e7490,#2563eb,#7c3aed)'
  },
  {
    value: 'mono',
    label: 'Mono',
    swatch: 'linear-gradient(135deg,#1c1917,#57534e,#a8a29e)'
  },
  {
    value: 'pastel',
    label: 'Pastel',
    swatch: 'linear-gradient(135deg,#fbcfe8,#bfdbfe,#bbf7d0)'
  },
  {
    value: 'neon',
    label: 'Neon',
    swatch: 'linear-gradient(135deg,#4c0519,#0f172a,#39ff14)'
  },
  {
    value: 'earth',
    label: 'Earth',
    swatch: 'linear-gradient(135deg,#78350f,#365314,#1c1917)'
  }
];

/** Sketch theme picker options with fg/bg colour swatches for the sidebar UI */
export const SKETCH_THEME_OPTIONS: {
  value: SeedIconSketchTheme;
  label: string;
  fg: string;
  bg: string;
}[] = [
  { value: 'current', label: 'Auto', fg: 'currentColor', bg: 'transparent' },
  { value: 'ink', label: 'Ink', fg: '#111111', bg: '#ffffff' },
  { value: 'chalk', label: 'Chalk', fg: '#f0ede8', bg: '#161616' },
  { value: 'slate', label: 'Slate', fg: '#1e293b', bg: '#f1f5f9' },
  { value: 'cobalt', label: 'Cobalt', fg: '#1d4ed8', bg: '#eff6ff' },
  { value: 'forest', label: 'Forest', fg: '#15803d', bg: '#f0fdf4' },
  { value: 'wine', label: 'Wine', fg: '#9f1239', bg: '#fff1f2' },
  { value: 'ember', label: 'Ember', fg: '#b45309', bg: '#fffbeb' },
  { value: 'violet', label: 'Violet', fg: '#6d28d9', bg: '#f5f3ff' }
];
