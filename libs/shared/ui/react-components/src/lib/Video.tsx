import React, { useEffect, useRef } from 'react';

export type VideoProps = {
  src: string;
  className?: string;
  onClick?: () => void;
};

/**
 * Video component with autoplay and no controls.
 *
 * @param props Video properties
 * @returns Video component
 */
export const Video: React.FC<VideoProps> = ({ className, onClick, src }) => {
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
    </video>
  );
};

export default Video;
