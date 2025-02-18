'use client';

import React from 'react';

import { CdwrCloud } from '@codeware/shared/ui/react-components';

import '../tailwind.css';

const Logo = () => {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="">
        <CdwrCloud
          width="100"
          height="100"
          className="text-black dark:text-white"
        />
      </div>
      <span className="text-black dark:text-white opacity-30 text-xl font-medium tracking-widest">
        Codeware CMS
      </span>
    </div>
  );
};

export default Logo;
