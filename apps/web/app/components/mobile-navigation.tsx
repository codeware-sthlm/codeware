import {
  Popover,
  PopoverBackdrop,
  PopoverButton,
  PopoverPanel
} from '@headlessui/react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { NavLink } from '@remix-run/react';

import { useNavigationTree } from '../utils/use-navigation-tree';

export function MobileNavigation(
  props: React.ComponentPropsWithoutRef<typeof Popover>
) {
  const navigationTree = useNavigationTree();

  if (navigationTree.length === 0) {
    return null;
  }

  return (
    <Popover {...props}>
      <PopoverButton className="group bg-core-navbar text-core-nav-link shadow-core-action-btn-shadow ring-core-action-btn-border hover:ring-core-action-btn-border-hover flex h-full items-center rounded-full object-contain px-4 py-2 text-sm font-medium shadow-lg ring-1 backdrop-blur">
        Menu
        <ChevronDownIcon className="stroke-core-nav-link/80 group-hover:stroke-core-nav-link ml-2 size-3" />
      </PopoverButton>
      <PopoverBackdrop
        transition
        className="bg-core-background-body/60 fixed inset-0 z-50 backdrop-blur-sm duration-150 data-[closed]:opacity-0 data-[enter]:ease-out data-[leave]:ease-in"
      />
      <PopoverPanel
        focus
        transition
        className="bg-core-background-content ring-core-action-btn-border-hover fixed inset-x-4 top-8 z-50 origin-top rounded-3xl p-8 ring-1 duration-150 data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:ease-out data-[leave]:ease-in"
      >
        <div className="flex flex-row-reverse items-center justify-between">
          <PopoverButton aria-label="Close menu" className="-m-1 p-1">
            <XMarkIcon className="size-6 hover:cursor-pointer" />
          </PopoverButton>
          <h2 className="text-sm font-medium">Navigation</h2>
        </div>
        <nav className="mt-6">
          <ul className="text-core-nav-link -my-2">
            {navigationTree.map(({ key, label, url }) => (
              <li key={key}>
                <PopoverButton
                  as={NavLink}
                  to={url}
                  className="hover:text-core-nav-link-hover block py-2"
                >
                  {label}
                </PopoverButton>
              </li>
            ))}
          </ul>
        </nav>
      </PopoverPanel>
    </Popover>
  );
}
