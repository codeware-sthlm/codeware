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
import type {
  SocialMediaBlock as SocialMediaBlockProps,
  SocialMediaBlockSocial
} from '@codeware/shared/util/payload-types';
import { cn } from '@codeware/shared/util/ui';
import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { usePayload } from '../providers/PayloadProvider';

// PoC:
// Simple text factory for i18n used by React clients
// without Payload i18n support
type LangCode = 'en' | 'sv';
type TextKey = 'clickToCopy' | 'copyFailed' | 'copied';
/** Component translations */
const langKey: Record<TextKey, Record<LangCode, string>> = {
  clickToCopy: { en: 'Click to copy', sv: 'Klicka för att kopiera' },
  copyFailed: {
    en: 'Failed to copy to clipboard',
    sv: 'Kopiering misslyckades'
  },
  copied: { en: 'Copied', sv: 'Kopierad' }
} as const;
/** Helper factory for i18n text */
const textFactory =
  (code: LangCode) =>
  (key: TextKey): string =>
    langKey[key][code];

/**
 * Render social media links in a flex layout.
 *
 * Displays social media icons with clickable links.
 *
 * - Email and Phone: Click to copy value to clipboard
 * - Others: Click to navigate to the platform URL
 */
export const SocialMediaBlock: React.FC<SocialMediaBlockProps> = ({
  direction,
  social
}) => {
  // TODO: Language support
  const t = textFactory('en');

  const { navigate } = usePayload();
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

  if (!social) {
    return null;
  }

  /** Handle click event for social media items */
  const handleClick = async (item: SocialMediaBlockSocial) => {
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
        window.alert(t('copyFailed'));
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

  /** Get tooltip content for social media item */
  const getTooltipContent = (item: SocialMediaBlockSocial) => {
    const { platform, email, phone, id } = item;
    if (copiedId === id) {
      return t('copied');
    }
    const toCopy = email || phone;
    if (toCopy) {
      return `${toCopy} (${t('clickToCopy')})`;
    }
    return getSocialIconName(platform);
  };

  return (
    <div
      className={cn(
        'flex',
        direction === 'vertical' ? 'flex-col gap-4' : 'flex-wrap gap-6'
      )}
    >
      {social.map((item) => {
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
                {isCopied ? t('copied') : item.label}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
