import { Inter } from 'next/font/google';
import React from 'react';

import { cn } from '@codeware/shared/util/ui';

import './globals.css';
import { ThemeProvider } from './components/theme-provider';
import { ModeToggle } from './components/ThemeToggle.client';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Payload Start Page',
  description: 'A start page for Payload in a Next.js app.'
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'bg-cdwr-light-gray/50 dark:text-cdwr-light-gray text-cdwr-space-cadet dark:bg-cdwr-darker-black flex min-h-screen flex-col',
          inter.className
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="flex justify-end p-6 sm:p-8">
            <ModeToggle />
          </header>
          <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center p-6 sm:p-8">
            {children}
          </main>
          <footer className="mx-auto flex flex-wrap justify-center gap-4 p-6 text-sm opacity-70 hover:opacity-100 hover:transition-opacity sm:flex-nowrap sm:gap-8 sm:p-8">
            <a
              className="relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-full after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100"
              href="https://github.com/codeware-sthlm/codeware/tree/main/packages/nx-payload"
              rel="noopener noreferrer"
              target="_blank"
            >
              @cdwr/payload
            </a>
            <a
              className="relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-full after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100"
              href="https://payloadcms.com/docs"
              rel="noopener noreferrer"
              target="_blank"
            >
              Documentation
            </a>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
