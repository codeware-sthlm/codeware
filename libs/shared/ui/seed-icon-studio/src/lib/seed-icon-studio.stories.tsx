import type { Meta, StoryObj } from '@storybook/react-vite';

import { generateSeedIcon } from './generator/generate-seed-icon';
import { SeedIconStudio } from './SeedIconStudio';
import {
  SeedIconOptions,
  SeedIconPalettes,
  SeedIconShapes,
  SeedIconSketchThemes
} from './types';

const meta = {
  title: 'Shared UI/Seed Icon Studio',
  parameters: {
    layout: 'fullscreen'
  }
} satisfies Meta;

export default meta;

// Full interactive studio
export const Studio: StoryObj = {
  name: 'Interactive Studio',
  render: () => <SeedIconStudio />
};

// Static grid previews

const DEMO_SEEDS = [
  'axiom-studio',
  'solar-labs',
  'drift-works',
  'nova-io',
  'forge-hq',
  'lumen-dev',
  'prism-co',
  'orbit-ai'
];

function IconGrid({
  seeds,
  options,
  size = 80
}: {
  seeds: string[];
  options?: SeedIconOptions;
  size?: number;
}) {
  return (
    <div className="flex flex-wrap gap-4 p-6">
      {seeds.map((seed) => {
        const svg = generateSeedIcon(seed, options);
        return (
          <div key={seed} className="flex flex-col items-center gap-2">
            <div
              style={{ width: size, height: size }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
            <span className="text-muted-foreground font-mono text-[10px]">
              {seed}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export const SolidSoft: StoryObj = {
  name: 'Generator / Solid + Soft',
  render: () => (
    <IconGrid seeds={DEMO_SEEDS} options={{ style: 'solid', shape: 'soft' }} />
  )
};

export const SolidCircular: StoryObj = {
  name: 'Generator / Solid + Circular',
  render: () => (
    <IconGrid
      seeds={DEMO_SEEDS}
      options={{ style: 'solid', shape: 'circular' }}
    />
  )
};

export const VibrantSoft: StoryObj = {
  name: 'Generator / Vibrant + Soft',
  render: () => (
    <IconGrid
      seeds={DEMO_SEEDS}
      options={{ style: 'vibrant', shape: 'soft' }}
    />
  )
};

export const VibrantCircular: StoryObj = {
  name: 'Generator / Vibrant + Circular',
  render: () => (
    <IconGrid
      seeds={DEMO_SEEDS}
      options={{ style: 'vibrant', shape: 'circular' }}
    />
  )
};

export const SketchThemes: StoryObj = {
  name: 'Generator / Sketch themes',
  render: () => (
    <div className="space-y-6 p-6">
      {SeedIconSketchThemes.map((theme) => (
        <div key={theme} className="space-y-2">
          <span className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
            {theme}
          </span>
          <div className="flex gap-3">
            {DEMO_SEEDS.slice(0, 6).map((seed) => {
              const svg = generateSeedIcon(seed, {
                style: 'sketch',
                sketchTheme: theme
              });
              return (
                <div
                  key={seed}
                  style={{ width: 56, height: 56 }}
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  )
};

export const SketchShapes: StoryObj = {
  name: 'Generator / Sketch shapes',
  render: () => (
    <div className="space-y-6 p-6">
      {SeedIconShapes.map((shape) => (
        <div key={shape} className="space-y-2">
          <span className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
            {shape}
          </span>
          <div className="flex gap-3">
            {DEMO_SEEDS.map((seed) => {
              const svg = generateSeedIcon(seed, {
                style: 'sketch',
                shape,
                sketchTheme: 'ink'
              });
              return (
                <div
                  key={seed}
                  style={{ width: 56, height: 56 }}
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  )
};

export const Palettes: StoryObj = {
  name: 'Generator / Solid palettes',
  render: () => (
    <div className="space-y-6 p-6">
      {[...SeedIconPalettes, undefined].map((palette) => (
        <div key={palette ?? 'auto'} className="space-y-2">
          <span className="text-muted-foreground font-mono text-xs tracking-wider uppercase">
            {palette ?? 'auto'}
          </span>
          <div className="flex gap-3">
            {DEMO_SEEDS.map((seed) => {
              const svg = generateSeedIcon(seed, {
                style: 'solid',
                shape: 'soft',
                palette
              });
              return (
                <div
                  key={seed}
                  style={{ width: 56, height: 56 }}
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  )
};

export const Sizes: StoryObj = {
  name: 'Generator / Sizes',
  render: () => (
    <div className="flex items-end gap-6 p-6">
      {[16, 24, 32, 48, 64, 96, 128].map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <div
            style={{ width: size, height: size }}
            dangerouslySetInnerHTML={{
              __html: generateSeedIcon('axiom-studio', {
                style: 'solid',
                shape: 'soft'
              })
            }}
          />
          <span className="text-muted-foreground text-xs">{size}px</span>
        </div>
      ))}
    </div>
  )
};
