import { cn } from '@codeware/shared/ui/shadcn';
import React, { useEffect, useRef, useState } from 'react';

type ImageProps = {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  className?: string;
};

/**
 * Lazy loading image component with basic error handling.
 *
 * This component is using the native browser lazy loading feature to load images only when they are in the viewport.
 * When the image fails to load, an error message card is rendered.
 *
 * It's meant to be a very basic image component without any fancy features.
 */
export const Image: React.FC<ImageProps> = ({
  src,
  alt,
  width,
  height,
  className = ''
}) => {
  const ref = useRef<HTMLImageElement>(null);
  const [error, setError] = useState(false);

  // Workaround for SSR and React hydration race condition
  useEffect(() => {
    const el = ref.current;
    if (el?.complete && el.naturalWidth === 0) {
      setError(true);
    }
  }, []);

  const containerStyles = {
    width: width || 'auto',
    height: height || 'auto'
  };

  return (
    // If in error state, show error message
    (error && (
      <div
        className={cn('overflow-hidden bg-red-50 rounded-lg', className)}
        style={containerStyles}
      >
        <div className="flex flex-col items-center justify-center w-full h-full text-red-500 text-center p-5">
          <svg
            className="w-6 h-6 mx-auto"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div className="mt-2 text-xs">
            Failed to load image
            {/* This hack prevents the error message from disappearing after a short delay */}
            <span className="text-transparent">
              {ref.current?.naturalWidth}
            </span>
          </div>
        </div>
      </div>
    )) || (
      // Otherwise render the image with native browser lazy loading
      <div className={className} style={containerStyles}>
        <img
          src={src}
          ref={ref}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          onError={(e) => setError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    )
  );
};

export default Image;
