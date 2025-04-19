import { CdwrCloud } from '@codeware/shared/ui/react-universal-components';

const Logo: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-black opacity-80 dark:text-white">
        <CdwrCloud />
      </div>
      <span className="text-xl font-medium tracking-widest text-black opacity-30 dark:text-white">
        Codeware CMS
      </span>
    </div>
  );
};

export default Logo;
