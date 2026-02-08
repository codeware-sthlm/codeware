'use client';

import {
  HeroIcon,
  HeroIconName
} from '@codeware/shared/ui/primitives';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@codeware/shared/ui/shadcn/components/alert';
import { TailwindColor } from '@codeware/shared/util/tailwind';
import type { UIFieldClientProps } from 'payload';

import type { CalloutFieldProps } from './callout.field';

const iconMap: Record<
  NonNullable<CalloutFieldProps['kind']>,
  { icon: HeroIconName; color: TailwindColor }
> = {
  info: {
    icon: 'InformationCircleIcon',
    color: 'blue-500'
  },
  warning: {
    icon: 'ExclamationCircleIcon',
    color: 'orange-500'
  },
  tip: {
    icon: 'LightBulbIcon',
    color: 'purple-500'
  }
};

/**
 * Callout field component for client-side rendering.
 *
 * Displays a callout field with a title and content.
 */
export const CalloutField: React.FC<UIFieldClientProps & CalloutFieldProps> = ({
  description,
  kind,
  title
}) => {
  return (
    <div className="twp field-type ui">
      <Alert>
        {kind && (
          <HeroIcon icon={iconMap[kind].icon} color={iconMap[kind].color} />
        )}
        {title && <AlertTitle>{title}</AlertTitle>}
        <AlertDescription>
          {description.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default CalloutField;
