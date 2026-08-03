'use client';

import {
  type Platform,
  SocialIcon,
  getSocialIconName
} from '@codeware/shared/ui/primitives';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@codeware/shared/ui/shadcn/components/tooltip';
import { t } from '@codeware/shared/util/i18n';
import { cn } from '@codeware/shared/util/ui';
import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { usePayload } from '../providers/PayloadProvider';

/**
 * Implicit contract: the shape of a `socialLinksField` row as it comes out of
 * the editor, shared by the social media block and the footer contacts.
 */
export type SocialLink = {
  platform: Platform;
  email?: string | null;
  phone?: string | null;
  url?: string | null;
  withLabel?: boolean | null;
  label?: string | null;
  id?: string | null;
};

type SocialLinksProps = {
  className?: string;
  direction?: ('horizontal' | 'vertical') | null;
  links: Array<SocialLink>;
};

/**
 * Render social links in a flex layout.
 *
 * Displays social media icons with clickable links.
 *
 * - Email and Phone: Click to copy value to clipboard
 * - Others: Click to navigate to the platform URL
 */
export const SocialLinks: React.FC<SocialLinksProps> = ({
  className,
  direction,
  links
}) => {
  const { navigate, locale } = usePayload();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!links.length) {
    return null;
  }

  /** Handle click event for social links */
  const handleClick = async (item: SocialLink) => {
    // Prevent multiple clicks while copied state is active
    if (copiedId) {
      return;
    }

    // Navigate to URL
    if (item.url) {
      return navigate(item.url);
    }

    // Guard against missing Clipboard API and handle potential errors
    if (!navigator?.clipboard?.writeText) {
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(t(locale, 'social.copyFailed'));
      }
      return;
    }

    // Copy email or phone to clipboard
    const toCopy = item.email || item.phone;
    if (toCopy) {
      await navigator.clipboard.writeText(toCopy);
      setCopiedId(item.id || null);
      // Clear any existing timeout before setting a new one
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Time to show feedback
      timeoutRef.current = setTimeout(() => setCopiedId(null), 2000);
    }
  };

  /** Get tooltip content for a social link */
  const getTooltipContent = (item: SocialLink) => {
    const { platform, email, phone, id } = item;
    if (copiedId === id) {
      return t(locale, 'social.copied');
    }
    const toCopy = email || phone;
    if (toCopy) {
      return `${toCopy} (${t(locale, 'social.clickToCopy')})`;
    }
    return getSocialIconName(platform);
  };

  return (
    <div
      className={cn(
        'flex',
        direction === 'vertical' ? 'flex-col gap-4' : 'flex-wrap gap-6',
        className
      )}
    >
      {links.map((item) => {
        const isCopied = copiedId === item.id;
        return (
          <div
            key={item.id || item.platform}
            className="group flex items-center gap-4 transition-all duration-300"
          >
            <TooltipProvider>
              <Tooltip key={isCopied ? 'copied' : 'default'}>
                <TooltipTrigger asChild>
                  {(isCopied && (
                    // Size should match social icon size
                    <Check className="text-core-link size-5" />
                  )) || (
                    <SocialIcon
                      className={cn(
                        'text-muted-foreground',
                        'group-hover:text-core-link transition-all duration-300 group-hover:scale-125 group-hover:cursor-pointer'
                      )}
                      platform={item.platform}
                      size="small"
                      onClick={() => handleClick(item)}
                    />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipContent(item)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {item.withLabel && (
              <button
                type="button"
                className={cn(
                  'border-0 bg-transparent p-0 text-left',
                  'group-hover:text-core-link transition-all duration-300 group-hover:cursor-pointer',
                  isCopied && 'cursor-default'
                )}
                onClick={() => handleClick(item)}
              >
                {isCopied ? t(locale, 'social.copied') : item.label}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
