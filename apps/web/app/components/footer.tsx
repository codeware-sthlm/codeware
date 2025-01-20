import { Link } from '@remix-run/react';

import { filterPages } from '../utils/filter-pages';
import { usePages } from '../utils/pages';

import { ContainerInner, ContainerOuter } from './container';

function NavLink({
  href,
  children
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link to={href} className="transition hover:text-teal-500">
      {children}
    </Link>
  );
}

export function Footer() {
  const pages = usePages();
  const pagesExceptHome = filterPages(pages, ['home']);

  return (
    <footer className="mt-32 flex-none">
      <ContainerOuter>
        <div className="border-t border-zinc-100 pb-16 pt-10 dark:border-zinc-700/40">
          <ContainerInner>
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {pagesExceptHome.map((page) => (
                  <NavLink key={page.slug} href={page.slug}>
                    {page.title}
                  </NavLink>
                ))}
              </div>
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
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
