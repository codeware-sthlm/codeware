import { readFileSync } from 'node:fs';

import { type Tree } from '@nx/devkit';
import { format, resolveConfig } from 'prettier';

import type { ThemeWriteGeneratorSchema } from './schema';

const THEME_LIB_PATH = 'libs/shared/theme/src/lib';

/** The only files this writes. */
const TOKEN_FILES = ['tokens-light.css', 'tokens-dark.css'] as const;

/**
 * Themes that may not be replaced, and why.
 *
 * Not a permission check — this runs on a developer's own machine. It is a
 * guard against replacing a theme whose job is to be a fixed reference, where
 * the damage is silent: the files would still compile and still pass the
 * completeness check, and only a Chromatic diff would ever say otherwise.
 */
const PROTECTED: Record<string, string> = {
  shadcn:
    'it is the pixel-perfect baseline against shadcn.com — the theme every ' +
    'other one is judged against. Fork it instead.',
  spotlight:
    'it is written with build-time theme() calls the studio cannot express. ' +
    'Edit spotlight-fork, which is the same theme in a form the studio owns.'
};

/** The shape the studio downloads. */
type ThemePayload = {
  name: string;
  files: Record<string, string>;
};

/**
 * Read the studio's download, refusing anything that is not one.
 *
 * A generator that writes CSS into the theme library from a file path is worth
 * being loud about: a wrong path should say so rather than write a theme out of
 * whatever JSON happened to be there.
 */
function readPayload(path: string): ThemePayload {
  let raw: string;
  try {
    raw = readFileSync(path, 'utf-8');
  } catch {
    throw new Error(`Could not read '${path}'.`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`'${path}' is not JSON.`);
  }

  const payload = parsed as Partial<ThemePayload>;
  const name = payload?.name;
  const files = payload?.files;

  if (typeof name !== 'string' || !name) {
    throw new Error(`'${path}' has no theme name.`);
  }
  if (!files || typeof files !== 'object') {
    throw new Error(`'${path}' carries no files.`);
  }

  const missing = TOKEN_FILES.filter(
    (file) => typeof files[file] !== 'string' || !files[file]
  );
  if (missing.length) {
    throw new Error(`'${path}' is missing ${missing.join(' and ')}.`);
  }

  return { name, files: files as Record<string, string> };
}

/**
 * Write a studio theme back over a built-in's token files.
 *
 * The counterpart to opening a built-in in the studio. A browser cannot replace
 * a file in the repository, and a dev-only server route that could would be a
 * production-guarded hole for no gain — so the studio hands over a JSON file and
 * this puts it where it belongs, as a working-tree change that goes through
 * review like any other.
 *
 * **Only the two token files.** `tailwind-base.css` is deliberately never
 * touched: the studio generates a fixed one, which would delete `codeware`'s
 * hand-written `@theme inline` brand block and `shadcn`'s baseline header. What
 * a theme declares beyond its tokens is not the studio's to rewrite.
 *
 * Nothing here validates the tokens. `nx sync` does that — `theme-sync` checks
 * every theme against the contract files and throws on a short one — which is
 * why the message below asks for it rather than repeating the check.
 *
 * @param tree - The workspace
 * @param options - `from`, a path to the studio's download
 */
export async function themeWriteGenerator(
  tree: Tree,
  options: ThemeWriteGeneratorSchema
) {
  const { name, files } = readPayload(options.from);

  const refusal = PROTECTED[name];
  if (refusal) {
    throw new Error(`'${name}' cannot be replaced: ${refusal}`);
  }

  const folder = `${THEME_LIB_PATH}/${name}`;
  if (!tree.exists(`${folder}/tokens-light.css`)) {
    throw new Error(
      `No theme called '${name}' in ${THEME_LIB_PATH}. This replaces an ` +
        `existing theme's tokens; use the studio's zip export to add a new one.`
    );
  }

  const prettierConfig = await resolveConfig(`${folder}/tokens-light.css`);
  const written: Array<string> = [];

  for (const file of TOKEN_FILES) {
    const contents = await format(files[file], {
      ...prettierConfig,
      parser: 'css'
    });

    if (contents !== tree.read(`${folder}/${file}`, 'utf-8')) {
      tree.write(`${folder}/${file}`, contents);
      written.push(file);
    }
  }

  if (!written.length) {
    console.log(`'${name}' already matches the studio — nothing written.`);
    return;
  }

  console.log(
    `Wrote ${written.join(' and ')} for '${name}'.\n` +
      `Run 'nx daemon --stop && nx sync' to regenerate the stylesheets and ` +
      `check the theme against the token contract.`
  );
}

export default themeWriteGenerator;
