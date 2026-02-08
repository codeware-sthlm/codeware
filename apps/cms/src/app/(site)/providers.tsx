'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

import { ThemeProvider } from '@codeware/app-cms/ui/web';
import { PayloadProvider } from '@codeware/shared/ui/cms-renderer';
import type { FormSubmitResponse } from '@codeware/shared/ui/cms-renderer';

type ProvidersProps = {
  children: React.ReactNode;
  payloadUrl: string;
};

/**
 * Combines all client-side providers needed for the CMS site.
 * Wraps children with ThemeProvider and PayloadProvider.
 */
export function Providers({ children, payloadUrl }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <PayloadProviderInner payloadUrl={payloadUrl}>
        {children}
      </PayloadProviderInner>
    </ThemeProvider>
  );
}

function PayloadProviderInner({ children, payloadUrl }: ProvidersProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  return (
    <PayloadProvider
      value={{
        navigate: (path, newTab) => {
          if (newTab || path.startsWith('http')) {
            window.open(path, '_blank');
          } else {
            router.push(path);
          }
        },
        payloadUrl,
        submitForm: async (data): Promise<FormSubmitResponse> => {
          try {
            const response = await fetch('/api/form-submissions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });

            if (!response.ok) {
              throw new Error('Form submission failed');
            }

            const result = await response.json();
            return {
              success: true,
              data: result
            };
          } catch (error) {
            return {
              success: false,
              data: {
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            };
          }
        },
        theme: resolvedTheme as 'light' | 'dark'
      }}
    >
      {children}
    </PayloadProvider>
  );
}
