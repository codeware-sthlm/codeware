import npmWhoami from 'npm-whoami';

/**
 * Check whether a user is logged in to npm
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
