import { Link, NavLink } from '@remix-run/react';
import clsx from 'clsx';

// eslint-disable-next-line @nx/enforce-module-boundaries
import cloudSvg from '/cloud.svg';

import { Container } from '@/components/Container';

function SunIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M8 12.25A4.25 4.25 0 0 1 12.25 8v0a4.25 4.25 0 0 1 4.25 4.25v0a4.25 4.25 0 0 1-4.25 4.25v0A4.25 4.25 0 0 1 8 12.25v0Z" />
      <path
        d="M12.25 3v1.5M21.5 12.25H20M18.791 18.791l-1.06-1.06M18.791 5.709l-1.06 1.06M12.25 20v1.5M4.5 12.25H3M6.77 6.77 5.709 5.709M6.77 17.73l-1.061 1.061"
        fill="none"
      />
    </svg>
  );
}

function MoonIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M17.25 16.22a6.937 6.937 0 0 1-9.47-9.47 7.451 7.451 0 1 0 9.47 9.47ZM12.75 7C17 7 17 2.75 17 2.75S17 7 21.25 7C17 7 17 11.25 17 11.25S17 7 12.75 7Z"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
          clsx(
            'relative block px-3 py-2 transition',
            isActive ? 'text-teal-500' : 'hover:text-teal-500'
          )
        }
      >
        {({ isActive }) => (
          <>
            {children}
            {isActive && (
              <span className="absolute inset-x-1 -bottom-px h-px bg-gradient-to-r from-teal-500/0 via-teal-500/40 to-teal-500/0" />
            )}
          </>
        )}
      </NavLink>
    </li>
  );
}

function DesktopNavigation(props: React.ComponentPropsWithoutRef<'nav'>) {
  return (
    <nav {...props}>
      {/** TODO Use page titles from CMS - COD-196 */}
      <ul className="flex rounded-full bg-white/90 px-3 text-sm font-medium text-zinc-800 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur">
        <NavItem href="/about">About</NavItem>
        <NavItem href="/articles">Articles</NavItem>
        <NavItem href="/projects">Projects</NavItem>
        <NavItem href="/speaking">Speaking</NavItem>
        <NavItem href="/uses">Uses</NavItem>
      </ul>
    </nav>
  );
}

export function Header() {
  return (
    <>
      <header className="pointer-events-none relative z-50 flex flex-none flex-col">
        <div className="top-0 z-10 h-16 pt-6">
          <Container className="w-full">
            <div className="relative flex gap-4">
              <div className="flex flex-1">
                <div className="h-10 w-10 bg-white/90 p-0.5 backdrop-blur">
                  <Link to="/" className="pointer-events-auto">
                    <img src={cloudSvg} alt="Cloud" className="h-9 w-9" />
                  </Link>
                </div>
              </div>
              <div className="flex flex-1 justify-end md:justify-center">
                {/** TODO Add mobile navigation - COD-195
                 * <MobileNavigation className="pointer-events-auto md:hidden" />
                 */}
                <DesktopNavigation className="pointer-events-auto hidden md:block" />
              </div>
              <div className="flex justify-end md:flex-1">
                <div className="pointer-events-auto">
                  {/** TODO Add theme toggle - COD-194 */}
                  <button
                    type="button"
                    aria-label="Toggle theme"
                    className="group rounded-full bg-white/90 px-3 py-2 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur transition"
                  >
                    <SunIcon className="h-6 w-6 fill-zinc-100 stroke-zinc-500 transition group-hover:fill-zinc-200 group-hover:stroke-zinc-700 [@media(prefers-color-scheme:dark)]:fill-teal-50 [@media(prefers-color-scheme:dark)]:stroke-teal-500 [@media(prefers-color-scheme:dark)]:group-hover:fill-teal-50 [@media(prefers-color-scheme:dark)]:group-hover:stroke-teal-600" />
                    {/* <SunIcon className="h-6 w-6 fill-zinc-100 stroke-zinc-500 transition group-hover:fill-zinc-200 group-hover:stroke-zinc-700 dark:hidden [@media(prefers-color-scheme:dark)]:fill-teal-50 [@media(prefers-color-scheme:dark)]:stroke-teal-500 [@media(prefers-color-scheme:dark)]:group-hover:fill-teal-50 [@media(prefers-color-scheme:dark)]:group-hover:stroke-teal-600" /> */}
                    {/* <MoonIcon className="hidden h-6 w-6 fill-zinc-700 stroke-zinc-500 transition dark:block [@media(prefers-color-scheme:dark)]:group-hover:stroke-zinc-400 [@media_not_(prefers-color-scheme:dark)]:fill-teal-400/10 [@media_not_(prefers-color-scheme:dark)]:stroke-teal-500" /> */}
                  </button>
                </div>
              </div>
            </div>
          </Container>
        </div>
      </header>
    </>
  );
}
