'use client';

import type { FooterData } from '@codeware/shared/util/payload-api';
import { formatReleaseName } from '@codeware/shared/util/pure';

import { ContainerInner, ContainerOuter } from '../layout/Container';
import { usePayload } from '../providers/PayloadProvider';
import { SocialLinks } from '../social/SocialLinks';

function NavLink({
  href,
  newTab,
  children
}: {
  href: string;
  newTab: boolean;
  children: React.ReactNode;
}) {
  const { navigate } = usePayload();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate(href, newTab);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className="hover:text-core-nav-link-hover transition"
    >
      {children}
    </a>
  );
}

/**
 * Resolve the copyright line, where `{year}` is replaced with the current year.
 *
 * Falls back to the application name when the editor has not set a copyright.
 */
const resolveCopyright = (copyright: string | null, appName: string): string =>
  (copyright?.trim() || `© {year} ${appName}`).replace(
    '{year}',
    String(new Date().getFullYear())
  );

/**
 * Site footer, configured per tenant in the CMS site settings.
 *
 * Renders nothing when the footer is disabled (`footer` is `null`).
 */
export function Footer({ footer }: { footer: FooterData | null }) {
  const { appInfo } = usePayload();

  if (!footer) {
    return null;
  }

  const { appName, contact, copyright, links, showVersion, tagline } = footer;

  return (
    <footer className="mt-32 flex-none">
      <ContainerOuter>
        <div className="border-t pt-10 pb-16">
          <ContainerInner>
            <div className="flex flex-col gap-6">
              {tagline && (
                <p className="text-muted-foreground max-w-xl text-sm whitespace-pre-line">
                  {tagline}
                </p>
              )}
              {(links.length > 0 || contact.length > 0) && (
                <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                  <div className="text-core-nav-link flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm font-medium">
                    {links.map(({ key, label, newTab, url }) => (
                      <NavLink key={key} href={url} newTab={newTab}>
                        {label}
                      </NavLink>
                    ))}
                  </div>
                  <SocialLinks links={contact} />
                </div>
              )}
              <div className="text-muted-foreground flex flex-col items-center justify-between gap-2 text-sm sm:flex-row">
                <p>{resolveCopyright(copyright, appName)}</p>
                {showVersion && <p>{formatReleaseName(appInfo)}</p>}
              </div>
            </div>
          </ContainerInner>
        </div>
      </ContainerOuter>
    </footer>
  );
}
