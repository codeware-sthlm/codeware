/**
 * Converts an array of key=value strings into a record object.
 *
 * @param arr - Array of strings in "KEY=VALUE" format
 * @returns Record object with parsed key-value pairs, or undefined if array is empty
 *
 * @example
 *
 * arrayToRecord(['FOO=bar', 'TOKEN=abc==def'])
 * // { FOO: 'bar', TOKEN: 'abc==def' }
 */
export const arrayToRecord = (
  arr: Array<string>
): Record<string, string> | undefined =>
  arr.length
    ? arr
        .map((line) => {
          const firstEqualIndex = line.indexOf('=');
          if (firstEqualIndex === -1) {
            return [line, ''];
          }
          return [
            line.substring(0, firstEqualIndex),
            line.substring(firstEqualIndex + 1)
          ];
        })
        .reduce(
          (acc, [key, value]) => {
            acc[key] = value;
            return acc;
          },
          {} as Record<string, string>
        )
    : undefined;
