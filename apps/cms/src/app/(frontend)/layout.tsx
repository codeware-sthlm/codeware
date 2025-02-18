import { Inter } from 'next/font/google';
import React from 'react';

import './globals.css';

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
    <html lang="en">
      <body className={inter.className}>
        <main className="main">{children}</main>
        <footer className="footer">
          <a
            href="https://github.com/codeware-sthlm/codeware/tree/main/packages/nx-payload"
            rel="noopener noreferrer"
            target="_blank"
          >
            @cdwr/payload
          </a>
          <a
            href="https://payloadcms.com/docs"
            rel="noopener noreferrer"
            target="_blank"
          >
            Documentation
          </a>
        </footer>
      </body>
    </html>
  );
}
