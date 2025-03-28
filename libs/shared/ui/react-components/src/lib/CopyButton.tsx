import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface CopyButtonProps {
  code: string;
  className?: string;
}

/**
 * A button that copies text to the clipboard when clicked.
 *
 * Positioned in the top right corner of the parent element.
 *
 * @param props - The component props.
 * @returns A React component that renders a copy button.
 */
export const CopyButton = ({ code, className = '' }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`absolute top-2 right-2 rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 ${className}`}
      aria-label="Copy code"
    >
      <div className="relative h-4 w-4">
        {(copied && (
          <CheckIcon className="h-4 w-4 text-green-800 dark:text-green-700" />
        )) || <ClipboardDocumentIcon className="h-4 w-4" />}
      </div>
    </button>
  );
};

export default CopyButton;
