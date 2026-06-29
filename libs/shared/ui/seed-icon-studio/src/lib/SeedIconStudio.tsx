'use client';

import { Badge } from '@codeware/shared/ui/shadcn/components/badge';
import { Button } from '@codeware/shared/ui/shadcn/components/button';
import { Input } from '@codeware/shared/ui/shadcn/components/input';
import { Label } from '@codeware/shared/ui/shadcn/components/label';
import { ScrollArea } from '@codeware/shared/ui/shadcn/components/scroll-area';
import { Separator } from '@codeware/shared/ui/shadcn/components/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
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
import { cn } from '@codeware/shared/util/ui';
import { useCallback, useRef, useState } from 'react';

import { generateSeedIcon } from './generator/generate-seed-icon';
import {
  ADJECTIVES,
  NOUNS,
  PALETTE_OPTIONS,
  SKETCH_THEME_OPTIONS
} from './studio-config';
import {
  type SeedIconOptions,
  type SeedIconPalette,
  type SeedIconShape,
  type SeedIconSketchTheme,
  type SeedIconStyle,
  type SeedIconTechTheme,
  SeedIconTechThemes
} from './types';

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Clickable icon tile that renders an SVG and highlights when selected. */
function IconCell({
  svg,
  selected,
  onClick,
  size,
  shape
}: {
  /** Raw SVG string to render via `dangerouslySetInnerHTML`. */
  svg: string;
  /** Whether this cell is currently selected. */
  selected: boolean;
  onClick: () => void;
  /** Pixel size for both width and height. */
  size: number;
  shape: SeedIconShape;
}) {
  const rounding =
    shape === 'circular'
      ? 'rounded-full'
      : shape === 'soft'
        ? 'rounded-xl'
        : 'rounded-sm';
  return (
    <button
      onClick={onClick}
      className={cn(
        'group focus-visible:ring-ring relative flex items-center justify-center overflow-hidden transition-all duration-150 focus-visible:ring-2 focus-visible:outline-none',
        rounding,
        selected
          ? 'ring-primary scale-[1.02] shadow-md ring-2'
          : 'ring-border hover:ring-primary/50 ring-1 hover:scale-[1.03]'
      )}
      style={{ width: size, height: size }}
      aria-pressed={selected}
    >
      <div
        className="h-full w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </button>
  );
}

/** Small toggle pill button used for shape and grid-count selectors. */
function OptionPill({
  active,
  onClick,
  children
}: {
  /** Whether this option is currently active (highlighted). */
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-md border px-3 py-1.5 text-xs font-medium transition-all',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/** Props for the {@link SeedIconStudio} component. */
type SeedIconStudioProps = {
  /** Initial seed string pre-populated in the seed input. Defaults to `'seed-icon-studio'`. */
  seed?: string;
  /** Initial rendering style tab. Defaults to `'solid'`. */
  style?: SeedIconStyle;
  /** Initial corner-shape selection. Defaults to `'soft'`. */
  shape?: SeedIconShape;
  /** Called with the raw SVG string when the user clicks "Use this icon". When omitted, a Download button is shown instead. */
  onSelect?: (svgCode: string) => void;
  /** Called when the user clicks Cancel. When omitted, no Cancel button is rendered. */
  onClose?: () => void;
};

/**
 * Full-page interactive studio for exploring and exporting deterministic seed icons.
 *
 * Renders a sidebar of controls (seed, style, shape, palette/theme, grid count) next to
 * a scrollable grid of icon previews. Selecting a cell reveals an Inspect sheet with the
 * SVG source and a copy/download/use action.
 */
export function SeedIconStudio({
  seed: initialSeed,
  style: initialStyle,
  shape: initialShape,
  onSelect,
  onClose
}: SeedIconStudioProps = {}) {
  const [seed, setSeed] = useState(initialSeed ?? 'seed-icon-studio');
  const [style, setStyle] = useState<SeedIconStyle>(initialStyle ?? 'solid');
  const [shape, setShape] = useState<SeedIconShape>(initialShape ?? 'soft');
  const [palette, setPalette] = useState<SeedIconPalette | 'auto'>('auto');
  const [sketchTheme, setSketchTheme] =
    useState<SeedIconSketchTheme>('current');
  const [techTheme, setTechTheme] = useState<SeedIconTechTheme>('dark');
  const [selected, setSelected] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const inputRef = useRef<HTMLInputElement>(null);
  // Sheet portal target — keeps the sheet inside the studio's stacking context instead of appending to <body>
  const rootRef = useRef<HTMLDivElement>(null);

  const seeds = Array.from({ length: gridSize }, (_, i) =>
    i === 0 ? seed : `${seed}::${i}`
  );

  const options: SeedIconOptions = {
    style,
    shape,
    ...((style === 'solid' || style === 'vibrant') && palette !== 'auto'
      ? { palette }
      : {}),
    ...(style === 'sketch' ? { sketchTheme } : {}),
    ...(style === 'tech' ? { techTheme } : {})
  };

  const selectedSvg =
    selected !== null ? generateSeedIcon(seeds[selected], options) : null;

  const randomSeed = useCallback(() => {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(Math.random() * 99);
    setSeed(`${adj}-${noun}-${num}`);
    setSelected(null);
  }, []);

  const copySelected = useCallback(() => {
    if (!selectedSvg) return;
    navigator.clipboard.writeText(selectedSvg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }, [selectedSvg]);

  const downloadSelected = useCallback(() => {
    if (!selectedSvg || selected === null) return;
    const blob = new Blob([selectedSvg], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `icon-${seeds[selected].replace(/::/g, '-')}.svg`;
    a.click();
  }, [selectedSvg, selected, seeds]);

  return (
    <TooltipProvider delayDuration={300}>
      <div
        ref={rootRef}
        className="bg-background text-foreground flex h-screen overflow-hidden"
      >
        {/* ── Sidebar ── */}
        <aside className="border-border bg-muted/30 flex shrink-0 flex-col border-r">
          <div className="border-border border-b p-4">
            <p className="text-muted-foreground mb-0.5 text-xs font-semibold tracking-widest uppercase">
              Seed Icon Studio
            </p>
            <p className="text-muted-foreground/60 text-[11px]">
              Deterministic SVG icons
            </p>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-6 p-4">
              {/* Seed input */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Seed
                </Label>
                <div className="flex gap-1.5">
                  <Input
                    ref={inputRef}
                    value={seed}
                    onChange={(e) => {
                      setSeed(e.target.value);
                      setSelected(null);
                    }}
                    className="h-8 font-mono text-sm"
                    placeholder="any string…"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={randomSeed}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                          <path d="M3 3v5h5" />
                        </svg>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Random seed</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <Separator />

              {/* Style */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Style
                </Label>
                <Tabs
                  value={style}
                  onValueChange={(v) => {
                    setStyle(v as SeedIconStyle);
                    setSelected(null);
                  }}
                >
                  <TabsList className="h-8 w-full text-xs">
                    {(
                      [
                        'solid',
                        'vibrant',
                        'sketch',
                        'tech'
                      ] satisfies SeedIconStyle[]
                    ).map((s) => (
                      <TabsTrigger key={s} value={s} className="flex-1 text-xs">
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Shape */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Shape
                </Label>
                <div className="flex gap-1.5">
                  {(
                    ['sharp', 'soft', 'circular'] satisfies SeedIconShape[]
                  ).map((s) => (
                    <OptionPill
                      key={s}
                      active={shape === s}
                      onClick={() => {
                        setShape(s);
                        setSelected(null);
                      }}
                    >
                      {s === 'sharp' ? '□' : s === 'soft' ? '▢' : '○'}{' '}
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </OptionPill>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Colour / theme options — vary by active style */}
              {style === 'solid' || style === 'vibrant' ? (
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Palette
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PALETTE_OPTIONS.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => {
                          setPalette(p.value as SeedIconPalette | 'auto');
                          setSelected(null);
                        }}
                        className={cn(
                          'flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-all',
                          palette === p.value
                            ? 'border-primary bg-primary/5 text-foreground font-medium'
                            : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                        )}
                      >
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-sm"
                          style={{ background: p.swatch }}
                        />
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : style === 'sketch' ? (
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Theme
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SKETCH_THEME_OPTIONS.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => {
                          setSketchTheme(t.value);
                          setSelected(null);
                        }}
                        className={cn(
                          'flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-all',
                          sketchTheme === t.value
                            ? 'border-primary bg-primary/5 text-foreground font-medium'
                            : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                        )}
                      >
                        {t.value === 'current' ? (
                          <span className="border-border from-muted-foreground/30 h-3.5 w-3.5 shrink-0 rounded-sm border bg-linear-to-br to-transparent" />
                        ) : (
                          <span
                            className="h-3.5 w-3.5 shrink-0 rounded-sm border"
                            style={{
                              background: t.bg,
                              borderColor: t.fg + '44'
                            }}
                          />
                        )}
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : style === 'tech' ? (
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Background
                  </Label>
                  <div className="flex gap-1.5">
                    {SeedIconTechThemes.map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setTechTheme(t);
                          setSelected(null);
                        }}
                        className={cn(
                          'flex flex-1 items-center justify-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-all',
                          techTheme === t
                            ? 'border-primary bg-primary/5 text-foreground font-medium'
                            : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                        )}
                      >
                        {t === 'current' ? (
                          <span className="border-border from-muted-foreground/30 h-3.5 w-3.5 shrink-0 rounded-sm border bg-linear-to-br to-transparent" />
                        ) : (
                          <span className="h-3.5 w-3.5 shrink-0 rounded-sm border border-cyan-500/40 bg-slate-900" />
                        )}
                        {t === 'current' ? 'Auto' : 'Dark'}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <Separator />

              {/* Grid size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Count
                  </Label>
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                    {gridSize}
                  </Badge>
                </div>
                <div className="flex gap-1.5">
                  {[12, 20, 36, 60].map((n) => (
                    <OptionPill
                      key={n}
                      active={gridSize === n}
                      onClick={() => setGridSize(n)}
                    >
                      {n}
                    </OptionPill>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="border-border border-t p-4">
            <p className="text-muted-foreground/50 text-center text-[10px]">
              Same seed + options = same icon, always
            </p>
          </div>
        </aside>

        {/* ── Main area ── */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Toolbar */}
          <header className="border-border bg-background/80 flex h-12 shrink-0 items-center justify-between border-b px-5 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground max-w-50 truncate font-mono text-sm">
                {seed}
              </span>
              <Badge variant="outline" className="h-5 text-[10px]">
                {style}
              </Badge>
              <Badge variant="outline" className="h-5 text-[10px]">
                {shape}
              </Badge>
              {style === 'sketch' ? (
                <Badge variant="outline" className="h-5 text-[10px]">
                  {sketchTheme}
                </Badge>
              ) : style === 'tech' ? (
                <Badge variant="outline" className="h-5 text-[10px]">
                  {techTheme}
                </Badge>
              ) : (
                palette !== 'auto' && (
                  <Badge variant="outline" className="h-5 text-[10px]">
                    {palette}
                  </Badge>
                )
              )}
            </div>
            <div className="flex items-center gap-2">
              {selected !== null ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => setSheetOpen(true)}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                    Inspect
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={copySelected}
                  >
                    {copied ? (
                      <>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Copied
                      </>
                    ) : (
                      <>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            width="14"
                            height="14"
                            x="8"
                            y="8"
                            rx="2"
                            ry="2"
                          />
                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </svg>
                        Copy SVG
                      </>
                    )}
                  </Button>
                  {onSelect ? (
                    <Button
                      size="sm"
                      className="h-7 gap-1.5 text-xs"
                      onClick={() => selectedSvg && onSelect(selectedSvg)}
                    >
                      Use this icon
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="h-7 gap-1.5 text-xs"
                      onClick={downloadSelected}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" x2="12" y1="15" y2="3" />
                      </svg>
                      Download
                    </Button>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Select an icon to export
                </p>
              )}
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={onClose}
                >
                  Cancel
                </Button>
              )}
            </div>
          </header>

          {/* Icon grid */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              <div
                className="grid gap-3"
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))'
                }}
              >
                {seeds.map((s, i) => {
                  const svg = generateSeedIcon(s, options);
                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <IconCell
                        svg={svg}
                        selected={selected === i}
                        onClick={() => setSelected(selected === i ? null : i)}
                        size={88}
                        shape={shape}
                      />
                      <span className="text-muted-foreground/50 w-full truncate text-center font-mono text-[10px]">
                        {i === 0 ? seed.slice(0, 10) : `…::${i}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </main>

        {/* ── Detail sheet ── */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent
            className="flex w-95 flex-col gap-0 p-0"
            container={rootRef.current}
          >
            <SheetHeader className="border-border border-b p-5">
              <SheetTitle className="text-sm font-medium">
                Icon details
              </SheetTitle>
            </SheetHeader>

            {selected !== null && selectedSvg && (
              <ScrollArea className="flex-1">
                <div className="space-y-5 p-5">
                  {/* Preview */}
                  <div className="bg-muted/40 flex items-center justify-center rounded-xl p-8">
                    <div
                      className="h-32 w-32"
                      dangerouslySetInnerHTML={{ __html: selectedSvg }}
                    />
                  </div>

                  {/* Meta */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Seed</span>
                      <span className="text-foreground max-w-50 truncate font-mono">
                        {seeds[selected]}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Style</span>
                      <span className="font-medium">{style}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Shape</span>
                      <span className="font-medium">{shape}</span>
                    </div>
                    {style === 'sketch' ? (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Theme</span>
                        <span className="font-medium">{sketchTheme}</span>
                      </div>
                    ) : style === 'tech' ? (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Background
                        </span>
                        <span className="font-medium">{techTheme}</span>
                      </div>
                    ) : (
                      palette !== 'auto' && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Palette</span>
                          <span className="font-medium">{palette}</span>
                        </div>
                      )
                    )}
                  </div>

                  <Separator />

                  {/* Usage snippet */}
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs tracking-wide uppercase">
                      Usage
                    </Label>
                    <pre className="bg-muted text-foreground/80 overflow-x-auto rounded-lg p-3 font-mono text-[11px] leading-relaxed break-all whitespace-pre-wrap">
                      {`generateSeedIcon(\n  "${seeds[selected]}",\n  {\n    style: "${style}",\n    shape: "${shape}",${style === 'sketch' ? `\n    sketchTheme: "${sketchTheme}",` : style === 'tech' ? `\n    techTheme: "${techTheme}",` : palette !== 'auto' ? `\n    palette: "${palette}",` : ''}\n  }\n)`}
                    </pre>
                  </div>

                  <Separator />

                  {/* SVG source */}
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs tracking-wide uppercase">
                      SVG source
                    </Label>
                    <pre className="bg-muted text-foreground/70 max-h-48 overflow-x-auto rounded-lg p-3 font-mono text-[10px] leading-relaxed break-all whitespace-pre-wrap">
                      {selectedSvg}
                    </pre>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="h-8 flex-1 gap-2 text-xs"
                      onClick={copySelected}
                    >
                      {copied ? '✓ Copied' : 'Copy SVG'}
                    </Button>
                    {onSelect ? (
                      <Button
                        className="h-8 flex-1 gap-2 text-xs"
                        onClick={() => selectedSvg && onSelect(selectedSvg)}
                      >
                        Use this icon
                      </Button>
                    ) : (
                      <Button
                        className="h-8 flex-1 gap-2 text-xs"
                        onClick={downloadSelected}
                      >
                        Download .svg
                      </Button>
                    )}
                  </div>
                </div>
              </ScrollArea>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}

export default SeedIconStudio;
