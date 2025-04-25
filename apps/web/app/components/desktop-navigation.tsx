import { cn } from '@codeware/shared/util/ui';
import { NavLink } from '@remix-run/react';

import { useNavigationTree } from '../utils/use-navigation-tree';

function NavItem({
  href,
  children
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li className="content-center">
      <NavLink
        to={href}
        className={({ isActive }) =>
          cn(
            'relative block min-w-max px-3 py-2 transition',
            isActive
              ? 'text-core-nav-link-active'
              : 'hover:text-core-nav-link-hover'
          )
        }
      >
        {({ isActive }) => (
          <>
            {children}
            {/* Add a gradient brand line to the active link for a visual effect */}
            {isActive && (
              <span className="from-core-nav-link-active/0 via-core-nav-link-active/40 to-core-nav-link-active/0 absolute inset-x-1 -bottom-0.5 h-px bg-gradient-to-r" />
            )}
          </>
        )}
      </NavLink>
    </li>
  );
}

export function DesktopNavigation(
  props: React.ComponentPropsWithoutRef<'nav'>
) {
  const navigationTree = useNavigationTree();

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
