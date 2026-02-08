import type { NavigationItem } from '@codeware/shared/util/payload-api';
import Link from 'next/link';

import { ContainerInner, ContainerOuter } from './container';

function NavLink({
  href,
  children
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="hover:text-core-nav-link-hover transition">
      {children}
    </Link>
  );
}

export function Footer({
  navigationTree
}: {
  navigationTree: NavigationItem[];
}) {
  if (navigationTree.length === 0) {
    return null;
  }

  return (
    <footer className="mt-32 flex-none">
      <ContainerOuter>
        <div className="border-t pt-10 pb-16">
          <ContainerInner>
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="text-core-nav-link flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm font-medium">
                {navigationTree.map(({ key, label, url }) => (
                  <NavLink key={key} href={url}>
                    {label}
                  </NavLink>
                ))}
              </div>
              <p className="text-muted-foreground text-sm">
                &copy; {new Date().getFullYear()} Codeware Sthlm AB. All rights
                reserved.
              </p>
            </div>
          </ContainerInner>
        </div>
      </ContainerOuter>
    </footer>
  );
}
