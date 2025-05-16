/**
 * Fetch a file from a remote URL.
 *
 * @param url The URL of the file to fetch.
 * @param onError Whether to throw an error if the fetch fails.
 * @returns A promise that resolves to the fetched file.
 */
export async function fetchFileByURL(
  url: string,
  onError: 'throwOnError'
): Promise<File>;
export async function fetchFileByURL(
  url: string,
  onError: 'nullOnError'
): Promise<File | null>;
export async function fetchFileByURL(
  url: string,
  onError: 'throwOnError' | 'nullOnError'
): Promise<File | null> {
  let msg = '';
  const fileName = url.split('/').at(-1);
  if (!fileName) {
    msg = `Can not fetch file, invalid URL: ${url}`;
    if (onError === 'throwOnError') {
      throw new Error(msg);
    }
    console.error(msg);
    return null;
  }

  const res = await fetch(url, {
    credentials: 'include',
    method: 'GET'
  });

  if (!res.ok) {
    msg = `Failed to fetch file from ${url}, status: ${res.status}`;
    if (onError === 'throwOnError') {
      throw new Error(msg);
    }
    console.error(msg);
    return null;
  }

  const blob = await res.blob();

  return new File([blob], fileName);
}
