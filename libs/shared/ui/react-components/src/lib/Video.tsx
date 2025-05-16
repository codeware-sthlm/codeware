import React, { ComponentPropsWithoutRef, useEffect, useRef } from 'react';

export type VideoProps = {
  /** Image alternative text for improved SEO and accessibility */
  alt: string;

  /** Video source URL */
  src: string;

  /** Function to handle click events on the video */
  onClick?: () => void;
} & ComponentPropsWithoutRef<'video'>;

/**
 * Video component with autoplay and no controls.
 *
 * **Draft status!**
 *
 * Not ready for production use yet.
 *
 * @param props Video properties
 * @returns Video component
 */
export const Video: React.FC<VideoProps> = ({
  alt,
  className,
  onClick,
  src
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  // const [showFallback] = useState<boolean>()

  useEffect(() => {
    const { current: video } = videoRef;
    if (video) {
      video.addEventListener('suspend', () => {
        // setShowFallback(true);
        // console.warn('Video was suspended, rendering fallback image.')
      });
    }
  }, []);

  return (
    <video
      autoPlay
      className={className}
      controls={false}
      loop
      muted
      onClick={onClick}
      playsInline
      ref={videoRef}
    >
      <source src={src} />
      <span className="sr-only">{alt}</span>
    </video>
  );
};

export default Video;
