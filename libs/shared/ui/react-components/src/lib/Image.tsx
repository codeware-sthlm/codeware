import { ImageOffIcon } from 'lucide-react';
import { ComponentPropsWithoutRef, JSX, useState } from 'react';

export type Size = {
  /** Image source */
  src: string;

  /** Whether to ignore media queries for this image */
  ignoreMedia?: boolean;

  /** Image MIME type */
  mimeType?: string;

  /** Image width */
  width?: string | number;
};

/**
 * Responsive image component that uses the `<picture>` element
 * to serve different images for different screen sizes.
 *
 * This is a good way to improve performance by serving smaller images
 * to smaller screens. The browser will automatically select the best image
 * based on the screen size and resolution.
 *
 * When the image fails to load, a broken image icon with an error message will be displayed.
 * This can be customized by passing a component to `errorComponent` property.
 */
export const Image = ({
  src: fallbackSrc,
  alt,
  height,
  width: fallbackWidth,
  sizes,
  errorComponent = (
    <div className="flex flex-col items-center text-red-500 opacity-70">
      <ImageOffIcon className="" />
      <span className="mt-2 text-sm">Image failed to load.</span>
    </div>
  )
}: {
  /** Fallback image source to use when an image can not be loaded from `sizes` */
  src: string;
  /** Image alternative text for improved SEO and accessibility */
  alt: string;
  /** Fallback image height information */
  height?: string | number;
  /** Fallback image width information */
  width?: string | number;

  /** Responsive image sizes */
  sizes?: Array<Size>;

  /** Error component to display when image fails to load */
  errorComponent?: JSX.Element;
} & ComponentPropsWithoutRef<'picture'>) => {
  const [error, setError] = useState(false);

  return (
    (error && errorComponent) || (
      <picture>
        {(sizes ?? [])
          .sort((a, b) => Number(a.width ?? 0) - Number(b.width ?? 0))
          .map(({ ignoreMedia, mimeType, src, width }, index) => (
            <source
              key={index}
              srcSet={`${src}${width ? ` ${width}w` : ''}`}
              media={
                width && !ignoreMedia ? `(max-width: ${width}px)` : undefined
              }
              type={mimeType}
            />
          ))}
        <img
          src={fallbackSrc}
          alt={alt}
          width={fallbackWidth}
          height={height}
          onError={() => setError(true)}
        />
      </picture>
    )
  );
};
