import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@codeware/shared/ui/shadcn/components/alert';

import { HeroIconName } from '../hero-icon/hero-icons';
import { HeroIcon } from '../hero-icon/HeroIcon';

export type CalloutProps = {
  description: Array<string>;
  kind?: 'info' | 'warning' | 'tip';
  title?: string;
};

const iconMap: Record<NonNullable<CalloutProps['kind']>, HeroIconName> = {
  info: 'InformationCircleIcon',
  warning: 'ExclamationCircleIcon',
  tip: 'LightBulbIcon'
};

/**
 * A universal component that renders a callout.
 */
export const Callout: React.FC<CalloutProps> = ({
  description,
  kind,
  title
}) => {
  return (
    <Alert>
      {kind && <HeroIcon icon={iconMap[kind]} />}
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>
        {description.map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </AlertDescription>
    </Alert>
  );
};
