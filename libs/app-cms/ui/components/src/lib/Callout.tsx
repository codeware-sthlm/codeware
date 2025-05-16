import {
  Callout as CalloutComponent,
  type CalloutProps
} from '@codeware/shared/ui/react-universal-components';
import type { ServerProps } from 'payload';

/**
 * Server component to display a callout.
 * @props `CalloutProps` - Props for the Callout component.
 */
export function Callout({
  kind,
  description,
  title
}: ServerProps & CalloutProps) {
  if (!description?.length) {
    console.warn('Callout: No description provided');
    return null;
  }
  return (
    <CalloutComponent kind={kind} description={description} title={title} />
  );
}

export default Callout;
