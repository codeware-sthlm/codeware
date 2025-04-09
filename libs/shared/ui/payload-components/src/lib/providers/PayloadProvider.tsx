import { Toaster } from '@codeware/shared/ui/shadcn/components/sonner';
import type { FormSubmission } from '@codeware/shared/util/payload-types';
import { type ReactNode, createContext, use } from 'react';

type FormSubmitData = {
  form: FormSubmission['form'];
} & {
  submissionData: Array<
    Pick<
      NonNullable<FormSubmission['submissionData']>[number],
      'field' | 'value'
    >
  >;
};

export type FormSubmitResponse =
  | {
      success: true;
      data: FormSubmission;
    }
  | {
      success: false;
      data: { error: string };
    };

export type PayloadValue = {
  /**
   * Provide a navigate function based on your framework.
   * It's used to navigate to a new path or URL.
   *
   * @param path - The path to navigate to.
   * @param newTab - Whether to open the link in a new tab.
   */
  navigate: (path: string, newTab?: boolean) => void;

  /**
   * Provide the fully qualified URL to the Payload app host.
   * This is used e.g. to render media images properly.
   *
   * Example: `'https://cms.domain.io'`
   */
  payloadUrl: string;

  /**
   * Provide a function to handle form submissions server-side.
   * This will allow for secure authentication requests via api key tokens.
   *
   * Required to implement the fetch request logic for form submissions.
   * ```ts
   * const response = await fetch(`${payloadUrl}/api/form-submissions`, {
   *   body: JSON.stringify(postBody),
   *   headers: {
   *     Authorization: `<api key prefix and token>`,
   *     'Content-Type': 'application/json'
   *   },
   *   method: 'POST'
   * });
   * ```
   *
   * @param data - The form submission data.
   * @returns The form submission response.
   */
  submitForm: (data: FormSubmitData) => Promise<FormSubmitResponse>;

  /**
   * Provide the current theme state.
   *
   * Use your theme state value to make this value reflect theme changes automatically.
   */
  theme: 'light' | 'dark' | undefined;
};

type PayloadProviderProps = {
  children: ReactNode;
  value: PayloadValue;
};

// Create a context
const Context = createContext<PayloadValue | null>(null);

/**
 * This provider is used to pass values to the Payload components.
 *
 * This component also setup shadcn sonner component for notifications.
 * @see https://ui.shadcn.com/docs/components/sonner
 */
export function PayloadProvider({ children, value }: PayloadProviderProps) {
  return (
    <Context.Provider value={value}>
      {children}
      <Toaster />
    </Context.Provider>
  );
}

/**
 * Hook to get access to the Payload context value,
 * which is set in the app root using the `PayloadProvider`.
 *
 * @throws If not context value has been set with `PayloadProvider`.
 */
export const usePayload = () => {
  const context = use(Context);
  if (!context) {
    throw new Error('usePayload must be used within a PayloadProvider');
  }
  return context;
};
