import Link from 'next/link';
import React from 'react';

import { Button } from '@codeware/shared/ui/shadcn/components/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-foreground/10 mb-2 text-9xl font-bold tracking-tight">
            404
          </h1>
          <div className="relative -mt-20">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Page not found
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Sorry, we could not find the page you were looking for.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/">Go back home</Link>
          </Button>
          {/* <Button asChild variant="outline" size="lg">
            <Link href="/contact">Contact support</Link>
          </Button> */}
        </div>
      </div>
    </div>
  );
}
