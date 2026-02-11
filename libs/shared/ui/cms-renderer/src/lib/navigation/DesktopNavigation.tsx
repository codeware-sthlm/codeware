'use client';

import type { NavigationItem } from '@codeware/shared/util/payload-api';
import { cn } from '@codeware/shared/util/ui';

import { usePayload } from '../providers/PayloadProvider';

function NavItem({
  href,
  children
}: {
  href: string;
  children: React.ReactNode;
}) {
  const { getCurrentPath, navigate } = usePayload();
  const pathname = getCurrentPath();

  // Normalize paths for comparison (remove trailing slashes)
  const normalizedPathname =
    pathname.endsWith('/') && pathname !== '/'
      ? pathname.slice(0, -1)
      : pathname;
  const normalizedHref =
    href.endsWith('/') && href !== '/' ? href.slice(0, -1) : href;

  const isActive = normalizedPathname === normalizedHref;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate(href);
  };

  return (
    <li className="content-center">
      <a
        href={href}
        onClick={handleClick}
        className={cn(
          'relative block min-w-max px-3 py-2 transition',
          isActive
            ? 'text-core-nav-link-active'
            : 'text-core-nav-link hover:text-core-nav-link-hover'
        )}
      >
        {children}
        {/* Add a gradient brand line to the active link for a visual effect */}
        {isActive && (
          <span className="from-core-nav-link-active/0 via-core-nav-link-active/40 to-core-nav-link-active/0 absolute inset-x-1 -bottom-0.5 h-px bg-linear-to-r" />
        )}
      </a>
    </li>
  );
}

export function DesktopNavigation({
  navigationTree,
  ...props
}: React.ComponentPropsWithoutRef<'nav'> & {
  navigationTree: NavigationItem[];
}) {
  if (navigationTree.length === 0) {
    return null;
  }

  return (
    <nav {...props}>
      <ul className="text-core-nav-link bg-core-navbar shadow-core-navbar-shadow ring-core-navbar-border flex h-full rounded-full px-3 text-sm font-medium shadow-lg ring-1 backdrop-blur">
        {navigationTree.map(({ key, label, url }) => (
          <NavItem key={key} href={url}>
            {label}
          </NavItem>
        ))}
      </ul>
    </nav>
  );
}
