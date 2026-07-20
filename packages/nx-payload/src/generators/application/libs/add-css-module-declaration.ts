import { type Tree } from '@nx/devkit';

import type { NormalizedSchema } from './normalize-options';

/**
 * Payload requires the side-effect import `import '@payloadcms/next/css'`
 * in the generated app router files.
 *
 * The package's `./css` export resolves to a plain `.css` file without any
 * type declarations. From TypeScript 6.0 `noUncheckedSideEffectImports` errors
 * on such imports, and the `*.css` wildcard from `@nx/next` does not match the
 * bare `@payloadcms/next/css` specifier (it has no `.css` suffix).
 *
 * Declare the module in the project's root `index.d.ts` so `next build` type
 * checking succeeds.
 *
 * @param host - The tree host
 * @param options - The normalized schema
 */
export function addCssModuleDeclaration(
  host: Tree,
  options: NormalizedSchema
): void {
  const declarationFile = `${options.directory}/index.d.ts`;
  const declaration = "declare module '@payloadcms/next/css';";

  const content = host.exists(declarationFile)
    ? (host.read(declarationFile, 'utf-8') ?? '')
    : '';

  if (content.includes(declaration)) {
    return;
  }

  const updated =
    content.length > 0
      ? `${content.replace(/\s*$/, '')}\n\n${declaration}\n`
      : `${declaration}\n`;

  host.write(declarationFile, updated);
}
