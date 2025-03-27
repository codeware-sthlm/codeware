'use client';
import { CdwrCloud } from '@codeware/shared/ui/react-components';

const Logo: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="">
        <CdwrCloud
          width="100"
          height="100"
          className="text-black dark:text-white"
        />
      </div>
      <span className="text-xl font-medium tracking-widest text-black opacity-30 dark:text-white">
        Codeware CMS
      </span>
    </div>
  );
};

export default Logo;
