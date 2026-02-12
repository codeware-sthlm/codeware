'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { useTheme } from 'next-themes';

import { PayloadProvider } from '@codeware/shared/ui/cms-renderer';
import type { FormSubmitResponse } from '@codeware/shared/ui/cms-renderer';
import type { FormSubmission } from '@codeware/shared/util/payload-types';

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
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <PayloadProviderInner payloadUrl={payloadUrl}>
        {children}
      </PayloadProviderInner>
    </NextThemesProvider>
  );
}

function PayloadProviderInner({ children, payloadUrl }: ProvidersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <PayloadProvider
      value={{
        getCurrentPath: () => pathname,
        navigate: (path, newTab) => {
          if (newTab || path.startsWith('http')) {
            window.open(path, '_blank');
          } else {
            router.push(path);
          }
        },
        payloadUrl,
        setTheme: (theme) => setTheme(theme),
        submitForm: async (data): Promise<FormSubmitResponse> => {
          try {
            const response = await fetch('/api/form-submissions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Form submission failed');
            }

            const result = await response.json();

            // API route returns minimal data: { success: true, id: string }
            // Convert to expected FormSubmission shape for compatibility
            return {
              success: true,
              data: {
                id: result.id,
                form: data.form,
                submissionData: data.submissionData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              } as FormSubmission
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
        theme: (theme as 'light' | 'dark' | 'system') ?? 'system',
        resolvedTheme: resolvedTheme as 'light' | 'dark'
      }}
    >
      {children}
    </PayloadProvider>
  );
}
