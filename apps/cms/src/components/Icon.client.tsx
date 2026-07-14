import { HomeIcon } from '@heroicons/react/24/outline';

/**
 * Mark for Payload's StepNav home link (`admin.components.graphics.Icon`).
 *
 * Without it Payload falls back to its own logo, putting Payload branding in the
 * toolbar. A neutral home glyph is used rather than the cloud mark, which stays
 * unique to the sidebar's workspace tile. It strokes with `currentColor`, so it
 * picks up Payload's toolbar text color and reads in both themes.
 *
 * `custom.css` makes the link and its inner span a centering flex box — Payload
 * leaves them `display: inline`, where the link's fixed square has no effect.
 */
const Icon: React.FC = () => {
  return <HomeIcon className="size-full text-current" />;
};

export default Icon;
