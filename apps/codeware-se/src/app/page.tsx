// Fix for getting standalone build to work
// https://github.com/nrwl/nx/issues/9017#issuecomment-1284740346
import path from 'path';
path.resolve('./next.config.cjs');

import Script from 'next/script';

import { Main } from './components/Main';
import { Meta } from './components/Meta';

export default function Home() {
  return (
    <>
      <Script id="theme">
        {`
if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark')
}`}
      </Script>
      <Main
        meta={
          <Meta
            title="Codeware"
            description="Codeware Sthlm AB"
            locale="se"
            siteName="codeware.se"
          />
        }
      />
    </>
  );
}
