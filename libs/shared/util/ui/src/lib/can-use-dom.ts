/**
 * Check if the DOM is available.
 *
 * @returns True if the DOM is available, false otherwise.
 */
export const canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);
