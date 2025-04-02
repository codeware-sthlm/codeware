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
    <li>
      <NavLink
        to={href}
        className={({ isActive }) =>
          cn(
            'relative block min-w-max px-3 py-2 transition',
            isActive
              ? 'text-teal-500 dark:text-teal-400'
              : 'hover:text-teal-500 dark:hover:text-teal-400'
          )
        }
      >
        {({ isActive }) => (
          <>
            {children}
            {isActive && (
              <span className="absolute inset-x-1 -bottom-px h-px bg-gradient-to-r from-teal-500/0 via-teal-500/40 to-teal-500/0 dark:from-teal-400/0 dark:via-teal-400/40 dark:to-teal-400/0" />
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
      <ul className="flex rounded-full bg-white/90 px-3 text-sm font-medium text-zinc-800 shadow-lg ring-1 shadow-zinc-800/5 ring-zinc-900/5 backdrop-blur dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/10">
        {navigationTree.map(({ key, label, url }) => (
          <NavItem key={key} href={url}>
            {label}
          </NavItem>
        ))}
      </ul>
    </nav>
  );
}
