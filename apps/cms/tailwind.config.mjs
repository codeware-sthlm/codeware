import path from 'path';
import { fileURLToPath } from 'url';

import { createGlobPatternsForDependencies } from '@nx/react/tailwind';
import typography from '@tailwindcss/typography';
import tailwindcssAnimate from 'tailwindcss-animate';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    path.join(
      dirname,
      'src/{app,components}/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(dirname)
  ],
  corePlugins: {
    preflight: false
  },
  darkMode: ['selector', '[data-theme="dark"]', '.dark'],
  //theme: {}
  plugins: [typography, tailwindcssAnimate]
};

export default config;
