'use client';

import { CopyButton } from '@codeware/shared/ui/copy-button';
import { Button } from '@codeware/shared/ui/shadcn/components/button';
import { Label } from '@codeware/shared/ui/shadcn/components/label';
import { ScrollArea } from '@codeware/shared/ui/shadcn/components/scroll-area';
import { Separator } from '@codeware/shared/ui/shadcn/components/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@codeware/shared/ui/shadcn/components/sheet';
import {
  Tabs,
  TabsList,
  TabsTrigger
} from '@codeware/shared/ui/shadcn/components/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@codeware/shared/ui/shadcn/components/tooltip';
import {
  type ColorFamily,
  type ColorShade,
  DEFAULT_RECIPE,
  NEUTRAL_FAMILIES,
  type ThemeRecipe,
  type ThemeTokens,
  buildThemeTokens,
  checkContrast,
  randomRecipe,
  shade
} from '@codeware/shared/util/color';
import { cn } from '@codeware/shared/util/ui';
import { DicesIcon, PanelLeftIcon } from 'lucide-react';
import { useId, useMemo, useState } from 'react';

import { ContrastReport } from './ContrastReport';
import { OverridePanel, type ThemeOverrides } from './OverridePanel';
import { previewCss, previewScope } from './preview-css';
import { ThemePreview } from './ThemePreview';

/** Offered as brand colours — the neutrals are a base choice, not a brand one. */
const BRAND_FAMILIES = [
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  ...NEUTRAL_FAMILIES
] as const satisfies ReadonlyArray<ColorFamily>;

const RADIUS_OPTIONS = [
  { label: 'Square', value: '0' },
  { label: 'Small', value: '0.35rem' },
  { label: 'Medium', value: '0.625rem' },
  { label: 'Large', value: '1rem' }
];

/** Link shades outside this range are either invisible or lost against body text. */
const LINK_SHADES: Array<ColorShade> = ['400', '500', '600', '700', '800'];

const titleCase = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

export type ThemeStudioResult = {
  recipe: ThemeRecipe;
  /** Only what was hand-edited; the rest follows the recipe */
  overrides: ThemeOverrides;
  tokensLight: ThemeTokens;
  tokensDark: ThemeTokens;
};

type ThemeStudioProps = {
  /** Recipe to open with, when editing an existing theme */
  recipe?: ThemeRecipe;
  /** Hand-edited tokens to restore alongside the recipe */
  overrides?: ThemeOverrides;
  onSelect?: (result: ThemeStudioResult) => void;
  onClose?: () => void;
};

const NO_OVERRIDES: ThemeOverrides = { light: {}, dark: {} };

function Swatch({
  family,
  selected,
  onSelect
}: {
  family: ColorFamily;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onSelect}
          aria-label={titleCase(family)}
          aria-pressed={selected}
          className={cn(
            'focus-visible:ring-ring size-7 rounded-md border transition-all focus-visible:ring-2 focus-visible:outline-none',
            selected
              ? 'ring-ring border-transparent ring-2 ring-offset-2'
              : 'border-border hover:scale-110'
          )}
          style={{ background: shade(family, '500') }}
        />
      </TooltipTrigger>
      <TooltipContent>{titleCase(family)}</TooltipContent>
    </Tooltip>
  );
}

function Pill({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-md border px-2 py-1 text-xs transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border hover:bg-accent'
      )}
    >
      {children}
    </button>
  );
}

/**
 * Author a theme from a recipe, with both schemes visible and checked.
 *
 * Four decisions drive all 84 light and 32 dark tokens — the core and prose
 * layers are fixed plumbing, and the shadcn layer is a set of steps off one
 * family. Exposing the tokens themselves would be a worse product and a longer
 * form; the ones that resist a recipe get a per-token override instead.
 *
 * The preview is scoped to its containers rather than the page, so light and
 * dark render together without an iframe and without touching `<html>`.
 */
export function ThemeStudio({
  recipe: initialRecipe,
  overrides: initialOverrides,
  onSelect,
  onClose
}: ThemeStudioProps = {}) {
  const scope = useId().replace(/:/g, '');
  const [recipe, setRecipe] = useState<ThemeRecipe>(
    initialRecipe ?? DEFAULT_RECIPE
  );
  const [overrides, setOverrides] = useState<ThemeOverrides>(
    initialOverrides ?? NO_OVERRIDES
  );
  const [scheme, setScheme] = useState<'light' | 'dark' | 'both'>('both');
  const [optionsOpen, setOptionsOpen] = useState(true);

  // What the recipe alone produces — the override panel needs it to show what
  // a token would revert to
  const generated = useMemo(() => buildThemeTokens(recipe), [recipe]);
  const { light, dark } = useMemo(
    () => buildThemeTokens(recipe, overrides),
    [recipe, overrides]
  );

  // Dark holds only what changes, so it is checked as the browser cascades it
  const contrast = useMemo(
    () => ({
      light: checkContrast(light),
      dark: checkContrast({ ...light, ...dark })
    }),
    [light, dark]
  );

  const failures =
    contrast.light.filter(({ passes }) => !passes).length +
    contrast.dark.filter(({ passes }) => !passes).length;

  const overrideCount =
    Object.keys(overrides.light).length + Object.keys(overrides.dark).length;

  const themeJson = useMemo(
    () =>
      JSON.stringify({ recipe, tokensLight: light, tokensDark: dark }, null, 2),
    [recipe, light, dark]
  );

  const ids = previewScope(scope);
  const update = (patch: Partial<ThemeRecipe>) =>
    setRecipe((current) => ({ ...current, ...patch }));

  return (
    <TooltipProvider>
      <div className="bg-background text-foreground flex h-screen overflow-hidden">
        <style>{previewCss(scope, light, dark)}</style>

        {optionsOpen && (
          <aside className="border-border bg-muted/30 flex w-72 shrink-0 flex-col border-r">
            <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
              <h2 className="text-sm font-semibold">Theme studio</h2>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={() => setRecipe(randomRecipe())}
                    aria-label="Shuffle the theme"
                  >
                    <DicesIcon className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Feeling lucky — rolls a recipe that passes contrast. Any
                  fine-tuned tokens are kept.
                </TooltipContent>
              </Tooltip>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-5 p-4">
                <div className="space-y-2">
                  <Label className="text-xs">Brand colour</Label>
                  <p className="text-muted-foreground text-[11px]">
                    Primary buttons, focus rings, links, active navigation and
                    the chart series.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {BRAND_FAMILIES.map((family) => (
                      <Swatch
                        key={family}
                        family={family}
                        selected={recipe.brandFamily === family}
                        onSelect={() => update({ brandFamily: family })}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Base colour</Label>
                  <p className="text-muted-foreground text-[11px]">
                    Every surface, border and neutral text.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {NEUTRAL_FAMILIES.map((family) => (
                      <Swatch
                        key={family}
                        family={family}
                        selected={recipe.baseFamily === family}
                        onSelect={() => update({ baseFamily: family })}
                      />
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-xs">Corner radius</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {RADIUS_OPTIONS.map(({ label, value }) => (
                      <Pill
                        key={value}
                        active={recipe.radius === value}
                        onClick={() => update({ radius: value })}
                      >
                        {label}
                      </Pill>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Link strength</Label>
                  <p className="text-muted-foreground text-[11px]">
                    Which step of the brand ramp links take.
                  </p>
                  {(['light', 'dark'] as const).map((forScheme) => (
                    <div key={forScheme} className="space-y-1">
                      <span className="text-muted-foreground text-[11px] capitalize">
                        {forScheme}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {LINK_SHADES.map((step) => (
                          <Pill
                            key={step}
                            active={recipe.linkShade[forScheme] === step}
                            onClick={() =>
                              update({
                                linkShade: {
                                  ...recipe.linkShade,
                                  [forScheme]: step
                                }
                              })
                            }
                          >
                            {step}
                          </Pill>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-xs">Readability</Label>
                  <ContrastReport scheme="Light" results={contrast.light} />
                  <ContrastReport scheme="Dark" results={contrast.dark} />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        Fine-tune tokens
                        {overrideCount > 0 && ` (${overrideCount})`}
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="left"
                      className="flex w-lg max-w-[90vw] flex-col gap-4 p-4"
                    >
                      <SheetHeader className="p-0">
                        <SheetTitle>Fine-tune tokens</SheetTitle>
                        <SheetDescription>
                          An edited token stops following the recipe, so
                          changing the brand or base later leaves it behind.
                        </SheetDescription>
                      </SheetHeader>
                      <OverridePanel
                        generated={generated}
                        overrides={overrides}
                        onChange={setOverrides}
                      />
                    </SheetContent>
                  </Sheet>

                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        View theme JSON
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="left"
                      className="flex w-lg max-w-[90vw] flex-col gap-4 p-4"
                    >
                      <SheetHeader className="p-0">
                        <SheetTitle>Theme JSON</SheetTitle>
                        <SheetDescription>
                          The recipe and both token maps, exactly as they are
                          stored.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="relative min-h-0 flex-1">
                        <CopyButton code={themeJson} label="Copy theme JSON" />
                        <ScrollArea className="h-full">
                          <pre className="bg-muted rounded-md p-3 pr-12 font-mono text-[11px] leading-relaxed">
                            {themeJson}
                          </pre>
                        </ScrollArea>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </ScrollArea>
          </aside>
        )}

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="border-border flex h-12 shrink-0 items-center justify-between gap-3 border-b px-5">
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    aria-label={
                      optionsOpen ? 'Hide theme options' : 'Show theme options'
                    }
                    aria-expanded={optionsOpen}
                    onClick={() => setOptionsOpen((open) => !open)}
                  >
                    <PanelLeftIcon className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {optionsOpen ? 'Hide options' : 'Show options'}
                </TooltipContent>
              </Tooltip>

              <Tabs
                value={scheme}
                onValueChange={(value) =>
                  setScheme(value as 'light' | 'dark' | 'both')
                }
              >
                <TabsList>
                  <TabsTrigger value="light">Light</TabsTrigger>
                  <TabsTrigger value="dark">Dark</TabsTrigger>
                  <TabsTrigger value="both">Both</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center gap-2">
              {failures > 0 && (
                <span className="text-destructive-subtle text-xs">
                  {failures} contrast {failures === 1 ? 'issue' : 'issues'}
                </span>
              )}
              {onSelect && (
                <Button
                  size="sm"
                  disabled={failures > 0}
                  title={
                    failures > 0
                      ? 'Fix the contrast issues before using this theme'
                      : undefined
                  }
                  onClick={() =>
                    onSelect({
                      recipe,
                      overrides,
                      tokensLight: light,
                      tokensDark: dark
                    })
                  }
                >
                  Use this theme
                </Button>
              )}
              {onClose && (
                <Button size="sm" variant="ghost" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </header>

          <ScrollArea className="flex-1">
            <div
              className={cn(
                'gap-4 p-5',
                scheme === 'both' ? 'grid lg:grid-cols-2' : 'flex flex-col'
              )}
            >
              {scheme !== 'dark' && <ThemePreview id={ids.light} />}
              {scheme !== 'light' && <ThemePreview id={ids.dark} dark />}
            </div>
          </ScrollArea>
        </main>
      </div>
    </TooltipProvider>
  );
}

export default ThemeStudio;
