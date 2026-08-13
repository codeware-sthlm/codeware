'use client';
import { Toaster } from '@codeware/shared/ui/shadcn/components/sonner';
import type { SignupPolicy } from '@codeware/shared/util/payload-api';
import type {
  FormSubmission,
  TenantIconConfig
} from '@codeware/shared/util/payload-types';
import { type ReactNode, createContext, use } from 'react';

import type { AppInfo } from '../about/AppAbout';

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

/** What a customer sends to sign up for a tour */
export type TourSignupData = {
  tour: number;
  name: string;
  email: string;
  phone?: string;
  /** People the signup is for — the capacity unit */
  people: number;
  /**
   * Whether the customer ticked the terms box. The server stamps the time
   * itself — a client-sent timestamp would be worth nothing as a record.
   */
  acceptedTerms?: boolean;
};

export type TourSignupResponse =
  | {
      success: true;
      /** Decided by the server from the tour's capacity, not by the client */
      data: { id: number; status: 'booked' | 'waiting' };
    }
  | {
      success: false;
      data: { error: string };
    };

export type PayloadValue = {
  /**
   * Provide the running app's build metadata (name, version, sha, deployEnv,
   * build time). Each app supplies its own — the About block renders it
   * app-agnostically via `usePayload().appInfo`.
   */
  appInfo: AppInfo;

  /**
   * Provide a tenant icon for a branded user experience.
   * This is used by components that render blocks with icons for tenants.
   *
   * Pass the icon from the tenant configuration directly - no app-level modification needed.
   * Set to `null` to suppress icon marks even when a block has it enabled.
   */
  iconConfig: TenantIconConfig | null;

  /**
   * Provide a function that returns the current URL path.
   * This is used for active route detection in navigation components.
   *
   * Example implementations:
   * - Next.js: `usePathname()` from 'next/navigation'
   * - Remix: `useLocation().pathname` from '@remix-run/react'
   * - React Router: `useLocation().pathname` from 'react-router-dom'
   *
   * @returns The current URL path (e.g., '/blog/my-post')
   */
  getCurrentPath: () => string;

  /**
   * Provide a navigate function based on your framework.
   * It's used to navigate to a path or URL.
   *
   * The `path` value can be a local path or an absolute URL.
   * The implementation is up to the app developer but it's recommended to:
   * - setup route definitions to local paths in your app
   * - apply external URL handling to absolute URLs (e.g. `window.location.href`)
   *
   * @param path - The path to navigate to.
   * @param newTab - Whether to open the link in a new tab.
   */
  navigate: (path: string, newTab?: boolean) => void;

  /**
   * Provide the fully qualified URL to Payload.
   *
   * For an external client, e.g. using web app, this should be the Payload CMS host.
   * For a tenant-scoped client, this is the app URL itself, since it serves both the frontend and the Payload API.
   *
   * This is used e.g. to render media images properly.
   *
   * Example: `'https://cms.domain.io'`
   */
  payloadUrl: string;

  /**
   * Provide a function to update the theme.
   * This is used by the theme switcher component.
   *
   * Example implementations:
   * - Next.js with next-themes: `setTheme` from `useTheme()` hook
   * - Custom: Update your theme state/context
   *
   * @param theme - The theme to set ('light', 'dark', or 'system')
   */
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  /**
   * Provide a function to handle form submissions server-side.
   * This will allow for secure authentication requests via api key tokens.
   *
   * Post to a route on **your own origin** and let that route talk to Payload
   * with the api key. Two things depend on it: the tenant api key must never
   * reach the browser, and no browser request may go cross-origin to the cms —
   * the api is not reachable from other origins by design.
   *
   * ```ts
   * // In the browser: same-origin only, no credentials of any kind
   * const response = await fetch('/form-submission', {
   *   body: JSON.stringify(postBody),
   *   headers: { 'Content-Type': 'application/json' },
   *   method: 'POST'
   * });
   *
   * // In that route, on the server: the api key stays here
   * await post('form-submissions', getPayloadRequestOptions(...));
   * ```
   *
   * @param data - The form submission data.
   * @returns The form submission response.
   */
  submitForm: (data: FormSubmitData) => Promise<FormSubmitResponse>;

  /**
   * Provide a function to handle tour signups server-side, the same way as
   * `submitForm` — the tenant api key must never reach the browser.
   *
   * The response carries the status the server decided: a customer signing up
   * for a full tour is put on the waiting list, and the form has to say so.
   *
   * Same shape as `submitForm`: post to your own origin, and let that route
   * reach the cms.
   *
   * ```ts
   * const response = await fetch('/tour-signup', {
   *   body: JSON.stringify(data),
   *   headers: { 'Content-Type': 'application/json' },
   *   method: 'POST'
   * });
   * ```
   *
   * @param data - The customer's signup details.
   * @returns The signup response.
   */
  submitTourSignup: (data: TourSignupData) => Promise<TourSignupResponse>;

  /**
   * Provide what the tour signup form must disclose about personal data —
   * the workspace's privacy and terms pages, and how long details are kept.
   *
   * Resolve it from site settings with `resolveSignupPolicy`. Omit only when
   * the app renders no tour signup form at all.
   */
  signupPolicy?: SignupPolicy | null;

  /**
   * Provide the current theme state.
   *
   * Use your theme state value to make this value reflect theme changes automatically.
   * This can be 'light', 'dark', or 'system' for auto-detection.
   */
  theme: 'light' | 'dark' | 'system' | undefined;

  /**
   * The resolved theme (what is actually displayed).
   * When theme is 'system', this will be 'light' or 'dark' based on system preference.
   */
  resolvedTheme?: 'light' | 'dark';

  /**
   * Provide the current locale/language code.
   *
   * This is used by components that need to display localized text.
   * Common values: 'en', 'sv', etc.
   *
   * Example implementations:
   * - From URL params, user preferences, or tenant configuration
   *
   * @example 'en', 'sv'
   */
  locale: string;
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
      <Toaster theme={value.resolvedTheme ?? 'system'} />
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
