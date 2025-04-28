import { cn } from '@codeware/shared/util/ui';
import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { ActionFunctionArgs } from '@remix-run/node';
import { data, redirect, useFetcher, useFetchers } from '@remix-run/react';
import { MonitorIcon, MoonStarIcon, SunIcon } from 'lucide-react';
import { ServerOnly } from 'remix-utils/server-only';
import { z } from 'zod';

import { useRequestInfo } from '../utils/request-info';
import { Theme, setTheme } from '../utils/theme.server';

// Resolve a reusable actio type
type ActionData = {
  result: ReturnType<
    Awaited<ReturnType<typeof parseWithZod<typeof ThemeFormSchema>>>['reply']
  >;
};

const ThemeFormSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']),
  // Used when the page has not hydrated yet for progressive enhancement
  redirectTo: z.string().optional()
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: ThemeFormSchema });
  if (submission.status !== 'success') {
    throw data('Invalid theme received', { status: 400 });
  }

  const { theme, redirectTo } = submission.value;

  const responseInit = {
    headers: { 'set-cookie': await setTheme(theme) }
  };

  if (redirectTo) {
    return redirect(redirectTo, responseInit);
  }

  return data<ActionData>({ result: submission.reply() }, responseInit);
}

export function ThemeSwitch({
  userPreference
}: {
  userPreference?: Theme | null;
}) {
  const fetcher = useFetcher<ActionData>();
  const optimisticMode = useOptimisticThemeMode();
  const requestInfo = useRequestInfo();

  const [form] = useForm({
    id: 'theme-switch',
    lastResult: fetcher.data?.result
  });

  const mode = optimisticMode ?? userPreference ?? 'system';
  const nextMode =
    mode === 'system' ? 'light' : mode === 'light' ? 'dark' : 'system';

  const icon = getThemeIcon(mode);

  return (
    <fetcher.Form
      method="POST"
      {...getFormProps(form)}
      action="/resources/theme-switch"
    >
      <ServerOnly>
        {() => (
          <input type="hidden" name="redirectTo" value={requestInfo?.path} />
        )}
      </ServerOnly>
      <input type="hidden" name="theme" value={nextMode} />
      <div>
        <button
          type="submit"
          className="group bg-core-action-btn-background shadow-core-action-btn-shadow ring-core-action-btn-border hover:ring-core-action-btn-border-hover rounded-full px-3 py-2 shadow-lg ring-1 backdrop-blur transition"
        >
          {icon}
          <span className="sr-only capitalize">{mode}</span>
        </button>
      </div>
    </fetcher.Form>
  );
}

/**
 * @returns the user's theme preference, or the client hint theme if the user
 * has not set a preference.
 */
export function useTheme() {
  const requestInfo = useRequestInfo();
  const optimisticMode = useOptimisticThemeMode();

  const hints = requestInfo?.hints;

  if (optimisticMode) {
    return optimisticMode === 'system' ? hints?.theme : optimisticMode;
  }
  return requestInfo?.userPrefs.theme ?? hints?.theme;
}

/**
 * If the user's changing their theme mode preference, this will return the
 * value it's being changed to.
 */
export function useOptimisticThemeMode() {
  const fetchers = useFetchers();
  const themeFetcher = fetchers.find(
    (f) => f.formAction === '/resources/theme-switch'
  );

  if (themeFetcher && themeFetcher.formData) {
    const submission = parseWithZod(themeFetcher.formData, {
      schema: ThemeFormSchema
    });

    if (submission.status === 'success') {
      return submission.value.theme;
    }
  }
}

/**
 * Render the icon with color transitions for the current theme mode.
 *
 * **A note about the user preferred theme feature**
 *
 * The icon gets the brand color when the user has selected a theme that isn't what the user actually prefers from its settings.
 * For example user prefers light mode but has selected dark mode.
 *
 * This feature is probably not obvious to the user and what is the actual purpose and gain of it?
 */
function getThemeIcon(mode: Theme | 'system'): React.ReactElement {
  const Icon =
    mode === 'light' ? SunIcon : mode === 'dark' ? MoonStarIcon : MonitorIcon;

  return (
    <Icon
      className={cn(
        'stroke-core-action-btn-foreground fill-core-action-btn-icon-fill group-hover:stroke-core-action-btn-foreground-hover size-6 stroke-[1.5] transition',
        {
          '[@media(prefers-color-scheme:dark)]:fill-brand-200 [@media(prefers-color-scheme:dark)]:stroke-brand-500':
            mode === 'light',
          '[@media_not_(prefers-color-scheme:dark)]:fill-brand-300 [@media_not_(prefers-color-scheme:dark)]:stroke-brand-500':
            mode === 'dark'
        }
      )}
    />
  );
}
