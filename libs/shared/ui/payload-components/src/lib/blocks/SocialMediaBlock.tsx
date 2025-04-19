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

import { usePayload } from '../providers/PayloadProvider';

/**
 * Render social media links in a flex layout.
 *
 * Displays social media icons with clickable links to the platform's URL.
 */
export const SocialMediaBlock: React.FC<SocialMediaBlockProps> = ({
  social
}) => {
  const { navigate } = usePayload();

  if (!social) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-6">
      {social.map(({ platform, url }) => (
        <TooltipProvider key={platform}>
          <Tooltip>
            <TooltipTrigger asChild>
              <SocialIcon
                className="hover:text-link text-muted-foreground transition-all duration-300 hover:scale-125 hover:cursor-pointer"
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
      ))}
    </div>
  );
};
