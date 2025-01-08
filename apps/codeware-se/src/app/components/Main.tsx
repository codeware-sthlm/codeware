import { ReactNode } from 'react';

import { ButtonThemeToggle } from './button-theme-toggle';
import { CloudIcon } from './cloud';

type IMainProps = {
  meta: ReactNode;
  children?: ReactNode;
};

export const Main = (props: IMainProps) => {
  return (
    <div className="relative h-full mx-auto overflow-hidden font-nasarg max-w-7xl">
      {props.meta}

      <div className="pt-6">
        <nav
          className="relative flex items-center justify-between px-4 sm:px-6"
          aria-label="Global"
        >
          <div className="flex items-center justify-end w-full">
            <ButtonThemeToggle />
          </div>
        </nav>
      </div>

      <div className="flex flex-col flex-auto h-full">
        <div className="pt-10 lg:overflow-hidden">
          <div className="pt-12 mx-auto sm:pt-24 sm:ml-10">
            <h1 className="flex flex-col justify-center w-full mt-5 space-y-2 tracking-widest sm:w-fit">
              <span className="text-5xl text-center sm:text-7xl">codeware</span>
              <span className="text-lg text-center uppercase tracking-sthlm text-gray-light">
                sthlm
              </span>
            </h1>
          </div>
        </div>

        <CloudIcon className="absolute max-w-lg mx-5 bottom-10 sm:right-10 opacity-10 dark:opacity-40" />
      </div>
    </div>
  );
};
