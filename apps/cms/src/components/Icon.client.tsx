import { CdwrCloud } from '@codeware/shared/ui/primitives';

/**
 * Mark for Payload's StepNav home link (`admin.components.graphics.Icon`).
 *
 * Without it Payload falls back to its own logo, putting Payload branding in
 * the toolbar. `CdwrCloud` paints with `currentColor`, so it picks up Payload's
 * own toolbar text color and stays legible in both themes.
 */
const Icon: React.FC = () => {
  // Payload sizes the home link to a fixed 16px square. `size` is the mark's
  // *width* — its height is derived from the aspect ratio (~11px) — so the
  // wrapper has to fill the square and center it, or the mark hangs at the top.
  return (
    <span className="flex size-full items-center justify-center text-current opacity-80">
      <CdwrCloud size={16} />
    </span>
  );
};

export default Icon;
