import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/** @type {import('tailwindcss').Config} */
const config = {
  plugins: {
    tailwindcss: {
      config: path.join(dirname, 'tailwind.config.mjs')
    },
    autoprefixer: {}
  }
};

export default config;
