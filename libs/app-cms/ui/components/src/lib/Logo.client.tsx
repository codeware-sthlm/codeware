'use client';
import { CdwrCloud } from '@codeware/shared/ui/primitives';

const Logo: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="">
        <div className="text-black dark:text-white">
          <CdwrCloud size={100} />
        </div>
      </div>
      <span className="text-xl font-medium tracking-widest text-black opacity-30 dark:text-white">
        Codeware CMS
      </span>
    </div>
  );
};

export default Logo;
