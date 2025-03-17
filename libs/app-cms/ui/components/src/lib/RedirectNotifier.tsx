'use client';

import { Dialog, DialogPanel } from '@headlessui/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { extractSearchParams } from './redirect-params';

/**
 * Notify the user about a redirect that was triggered by `VerifyTenantDomain`.
 *
 * The component should be rendered in a login hook
 */
export const RedirectNotifier: React.FC = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);

  const extractedParams = extractSearchParams(searchParams);

  useEffect(() => {
    if (extractedParams) {
      // Clean up URL by removing redirect parameters
      const params = new URLSearchParams(extractedParams.origin);
      for (const key of Array.from(params.keys())) {
        params.delete(key);
      }

      // Persist other URL parameters when available
      const newUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;

      // Replace URL stripped from redirect parameters
      router.replace(newUrl);

      // TODO: Apply email to login form if possible?
      //const email = extractedParams.redirect.email;

      // Open modal
      setIsOpen(true);
    }
  }, [extractedParams, pathname, router]);

  return (
    <Dialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      className="fixed inset-0 z-50 flex w-screen items-center justify-center p-4 transition duration-300 ease-out data-[closed]:opacity-0"
    >
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        aria-hidden="true"
      />

      <DialogPanel className="relative w-full max-w-md rounded-2xl bg-gray-800 p-6 text-center transform transition-all duration-300 ease-out scale-100 data-[closed]:scale-95">
        <h2 className="text-2xl font-semibold mb-4 text-white">Redirected</h2>

        <div className="text-lg my-8 text-gray-300">
          You were redirected to your tenant CMS domain. For security reasons
          the session can not be reused.
          <div className="mt-6 font-bold">Please log in again!</div>
        </div>

        <div className="w-full px-4">
          <button
            onClick={() => setIsOpen(false)}
            className="hover:cursor-pointer w-full p-4 rounded-lg border-0 hover:opacity-80 hover:text-white transition-opacity"
          >
            Got it!
          </button>
        </div>
      </DialogPanel>
    </Dialog>
  );
};

export default RedirectNotifier;
