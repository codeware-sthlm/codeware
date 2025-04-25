import {
  SocialIcon,
  getSocialIconName
} from '@codeware/shared/ui/react-universal-components';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@codeware/shared/ui/shadcn/components/tooltip';
import type { SocialMediaBlock as SocialMediaBlockProps } from '@codeware/shared/util/payload-types';
import { cn } from '@codeware/shared/util/ui';

import { usePayload } from '../providers/PayloadProvider';

/**
 * Render social media links in a flex layout.
 *
 * Displays social media icons with clickable links to the platform's URL.
 */
export const SocialMediaBlock: React.FC<SocialMediaBlockProps> = ({
  direction,
  social
}) => {
  const { navigate } = usePayload();

  if (!social) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex',
        direction === 'vertical' ? 'flex-col gap-4' : 'flex-wrap gap-6'
      )}
    >
      {social.map(({ label, platform, url, withLabel }) => (
        <div
          key={platform}
          className="group flex items-center gap-4 transition-all duration-300"
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <SocialIcon
                  className="text-muted-foreground group-hover:text-core-link transition-all duration-300 group-hover:scale-125 group-hover:cursor-pointer"
                  platform={platform}
                  size="small"
                  onClick={() => navigate(url)}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{getSocialIconName(platform)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {withLabel && (
            <span className="group-hover:text-core-link transition-all duration-300 group-hover:cursor-pointer">
              {label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
