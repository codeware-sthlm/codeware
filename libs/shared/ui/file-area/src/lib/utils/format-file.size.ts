type Options = {
  /**
   * Number of decimal places to include in the formatted string.
   * @default 2
   */
  decimals?: number;
};

/**
 * Format file size to human-readable string.
 *
 * @param bytes Number of bytes to format.
 * @param options Options for formatting.
 * @returns Human-readable file size string.
 *
 * @example
 * ```ts
 * formatFileSize(1024);    // "1 KB"
 * formatFileSize(1048576); // "1 MB"
 * ```
 */
export const formatFileSize = (
  bytes: number,
  { decimals = 2 }: Options = {}
): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  const sizeValue = (bytes / Math.pow(k, i)).toFixed(decimals);
  const number = parseFloat(sizeValue);

  return `${number} ${sizes[i]}`;
};
