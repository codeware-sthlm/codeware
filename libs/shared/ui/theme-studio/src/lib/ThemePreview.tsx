'use client';

import { Badge } from '@codeware/shared/ui/shadcn/components/badge';
import { Button } from '@codeware/shared/ui/shadcn/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@codeware/shared/ui/shadcn/components/card';
import { Input } from '@codeware/shared/ui/shadcn/components/input';
import { Separator } from '@codeware/shared/ui/shadcn/components/separator';
import { cn } from '@codeware/shared/util/ui';

type ThemePreviewProps = {
  /** Id the scoped stylesheet targets */
  id: string;
  /** Adds the class the `dark:` variant keys off, so components invert too */
  dark?: boolean;
  className?: string;
};

/**
 * A page under the draft tokens.
 *
 * Deliberately not the real block renderer: those need a CMS document and a
 * provider, and the tokens are what is being judged, not the content. What this
 * does carry is every surface the tokens actually reach — the navbar and
 * headline off `--core-*`, prose and links, the shadcn control set, and a muted
 * panel — so a token that goes wrong shows up here rather than after saving.
 *
 * The `dark` class goes on the container rather than `<html>`, which is what
 * lets both schemes render side by side on one page.
 */
export function ThemePreview({ id, dark, className }: ThemePreviewProps) {
  return (
    <div
      id={id}
      className={cn(
        'bg-core-background-body text-core-text overflow-hidden rounded-lg border',
        dark && 'dark',
        className
      )}
    >
      <div className="border-core-navbar-border bg-core-navbar flex items-center justify-between border-b px-4 py-2.5">
        <span className="text-core-header text-sm font-semibold">Acme</span>
        <nav className="flex items-center gap-4 text-sm">
          <span className="text-core-nav-link-active font-medium">Home</span>
          <span className="text-core-nav-link">Articles</span>
          <span className="text-core-nav-link">About</span>
          <span className="border-core-action-btn-border bg-core-action-btn-background text-core-action-btn-foreground rounded-full border px-2 py-1 text-xs">
            Aa
          </span>
        </nav>
      </div>

      <div className="bg-core-background-content space-y-5 px-5 py-6">
        <div>
          <h1 className="text-core-headline text-2xl font-bold tracking-tight">
            The quick brown fox
          </h1>
          <p className="text-core-text mt-2 text-sm leading-relaxed">
            Body copy sits on the content surface, with{' '}
            <span className="text-core-link underline">a link</span> and{' '}
            <span className="text-muted-foreground">secondary text</span>{' '}
            alongside it.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">Primary</Button>
          <Button size="sm" variant="secondary">
            Secondary
          </Button>
          <Button size="sm" variant="outline">
            Outline
          </Button>
          <Button size="sm" variant="destructive">
            Delete
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Error</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>

        <Input placeholder="Focus me to see the ring" className="max-w-xs" />

        <Separator />

        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Card surface</CardTitle>
              <CardDescription>
                Muted text on the card background.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              Cards, popovers and dropdowns share these tokens.
            </CardContent>
          </Card>

          <div className="bg-muted text-muted-foreground rounded-lg p-4 text-sm">
            <p className="text-foreground font-medium">Muted panel</p>
            <p className="mt-1">
              The pair most likely to fail contrast — muted text on a muted
              surface.
            </p>
            <p className="text-destructive-subtle mt-2">
              Something went wrong.
            </p>
          </div>
        </div>

        <pre className="bg-secondary text-foreground overflow-x-auto rounded-lg p-3 font-mono text-xs">
          {'const theme = buildThemeTokens(recipe);'}
        </pre>
      </div>
    </div>
  );
}
