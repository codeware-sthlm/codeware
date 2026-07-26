import npmWhoami from 'npm-whoami';

/**
 * Check whether a user is logged in to npm.
 *
 * Kept local to this lib so the release CLI stays self-contained: it runs
 * directly via `tsx` (see the `release-cli` target), which does not resolve
 * `@codeware/*` path aliases, and pulling the `misc` barrel would drag in its
 * native deps (node-pty, docker) for a single helper.
 *
 * @returns User name of logged in user or empty string otherwise
 */
export async function whoami(): Promise<string> {
  return new Promise((resolve) => {
    npmWhoami((err, user) => {
      if (err || !user) {
        resolve('');
      } else {
        resolve(user);
      }
    });
  });
}
