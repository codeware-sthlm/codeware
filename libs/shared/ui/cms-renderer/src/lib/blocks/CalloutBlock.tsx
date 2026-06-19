import { Button } from '@codeware/shared/ui/shadcn/components/button';
import type { CalloutBlock as CalloutBlockProps } from '@codeware/shared/util/payload-types';

import { usePayload } from '../providers/PayloadProvider';
import { resolveLinkGroup } from '../utils/resolve-link-group';

/**
 * Callout block — compact centered CTA band ("mini hero").
 * Optional cloud mark, heading, short body, single action button.
 */
export const CalloutBlock: React.FC<CalloutBlockProps> = ({
  showMark,
  heading,
  body,
  link
}) => {
  const { navigate, tenantIcon } = usePayload();
  const resolved = resolveLinkGroup(link);

  return (
    <section className="flex flex-col items-center text-center">
      {showMark && tenantIcon && (
        <div className="text-core-link mb-6">{tenantIcon(48)}</div>
      )}
      <h2 className="text-core-headline max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
        {heading}
      </h2>
      {body && (
        <p className="text-muted-foreground mt-4 max-w-md text-base leading-relaxed">
          {body}
        </p>
      )}
      {resolved && (
        <div className="mt-8">
          <Button onClick={() => navigate(resolved.path, resolved.newTab)}>
            {resolved.label}
          </Button>
        </div>
      )}
    </section>
  );
};
