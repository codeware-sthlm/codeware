'use client';

import { AppProps } from 'next/app';
import { useEffect } from 'react';

import { useThemeSwitch } from './hooks/use-theme-switch';

import './styles.css';

export default function App({ Component, pageProps }: AppProps) {
  // Use flowbite ui
  useEffect(() => {
    import('flowbite');
  }, []);

  // Setup theme support
  useThemeSwitch();

  return (
    <>
      <Component {...pageProps} />
    </>
  );
}
