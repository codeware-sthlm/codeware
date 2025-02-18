import React from 'react';

/**
 * Mock for default import of `next/image`.
 *
 * Returns `HTMLImageElement` with `alt` set to `Mocked Next Image`.
 */
export const mockNextImage = () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt="Mocked Next Image" />;
  }
});

export default mockNextImage;
