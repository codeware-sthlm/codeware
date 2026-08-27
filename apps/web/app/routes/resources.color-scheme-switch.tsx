import { cn } from '@codeware/shared/util/ui';
import { getFormProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { ActionFunctionArgs } from '@remix-run/node';
import { data, redirect, useFetcher, useFetchers } from '@remix-run/react';
import { MonitorIcon, MoonStarIcon, SunIcon } from 'lucide-react';
import { ServerOnly } from 'remix-utils/server-only';
import { z } from 'zod';

import { ColorScheme, setColorScheme } from '../utils/color-scheme.server';
import { useRequestInfo } from '../utils/request-info';

const ACTION_PATH = '/resources/color-scheme-switch';

// Resolve a reusable actio type
type ActionData = {
  result: ReturnType<
    Awaited<
      ReturnType<typeof parseWithZod<typeof ColorSchemeFormSchema>>
    >['reply']
  >;
};

const ColorSchemeFormSchema = z.object({
  colorScheme: z.enum(['system', 'light', 'dark']),
  // Used when the page has not hydrated yet for progressive enhancement
  redirectTo: z.string().optional()
});

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: ColorSchemeFormSchema });
  if (submission.status !== 'success') {
    throw data('Invalid color scheme received', { status: 400 });
  }

  const { colorScheme, redirectTo } = submission.value;

  const responseInit = {
    headers: { 'set-cookie': await setColorScheme(colorScheme) }
  };

  if (redirectTo) {
    return redirect(redirectTo, responseInit);
  }

  return data<ActionData>({ result: submission.reply() }, responseInit);
}

export function ColorSchemeSwitch({
  userPreference
}: {
  userPreference?: ColorScheme | null;
}) {
  const fetcher = useFetcher<ActionData>();
  const optimisticColorScheme = useOptimisticColorScheme();
  const requestInfo = useRequestInfo();

  const [form] = useForm({
    id: 'color-scheme-switch',
    lastResult: fetcher.data?.result
  });

  const current = optimisticColorScheme ?? userPreference ?? 'system';
  const next =
    current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system';

  const icon = getColorSchemeIcon(current);

  return (
    <fetcher.Form method="POST" {...getFormProps(form)} action={ACTION_PATH}>
      <ServerOnly>
        {() => (
          <input type="hidden" name="redirectTo" value={requestInfo?.path} />
        )}
      </ServerOnly>
      <input type="hidden" name="colorScheme" value={next} />
      <div>
        <button
          type="submit"
          className="group bg-core-action-btn-background shadow-core-action-btn-shadow ring-core-action-btn-border hover:ring-core-action-btn-border-hover rounded-full px-3 py-2 shadow-lg ring-1 backdrop-blur transition"
        >
          {icon}
          <span className="sr-only capitalize">{current}</span>
        </button>
      </div>
    </fetcher.Form>
  );
}

/**
 * @returns the user's color scheme preference, or the client hint value if the
 * user has not set a preference.
 */
export function useColorScheme() {
  const requestInfo = useRequestInfo();
  const optimisticColorScheme = useOptimisticColorScheme();

  const hints = requestInfo?.hints;

  if (optimisticColorScheme) {
    return optimisticColorScheme === 'system'
      ? hints?.colorScheme
      : optimisticColorScheme;
  }
  return requestInfo?.userPrefs.colorScheme ?? hints?.colorScheme;
}

/**
 * If the user's changing their color scheme preference, this will return the
 * value it's being changed to.
 */
export function useOptimisticColorScheme() {
  const fetchers = useFetchers();
  const colorSchemeFetcher = fetchers.find((f) => f.formAction === ACTION_PATH);

  if (colorSchemeFetcher && colorSchemeFetcher.formData) {
    const submission = parseWithZod(colorSchemeFetcher.formData, {
      schema: ColorSchemeFormSchema
    });

    if (submission.status === 'success') {
      return submission.value.colorScheme;
    }
  }
}

/**
 * Render the icon with color transitions for the current color scheme.
 *
 * **A note about the user preferred color scheme feature**
 *
 * The icon gets the brand color when the user has selected a color scheme that isn't what the user actually prefers from its settings.
 * For example user prefers light but has selected dark.
 *
 * This feature is probably not obvious to the user and what is the actual purpose and gain of it?
 */
function getColorSchemeIcon(
  colorScheme: ColorScheme | 'system'
): React.ReactElement {
  const Icon =
    colorScheme === 'light'
      ? SunIcon
      : colorScheme === 'dark'
        ? MoonStarIcon
        : MonitorIcon;

  return (
    <Icon
      className={cn(
        'stroke-core-action-btn-foreground fill-core-action-btn-icon-fill group-hover:stroke-core-action-btn-foreground-hover size-6 stroke-[1.5] transition',
        {
          '[@media(prefers-color-scheme:dark)]:fill-brand-200 [@media(prefers-color-scheme:dark)]:stroke-brand-500':
            colorScheme === 'light',
          '[@media_not_(prefers-color-scheme:dark)]:fill-brand-300 [@media_not_(prefers-color-scheme:dark)]:stroke-brand-500':
            colorScheme === 'dark'
        }
      )}
    />
  );
}
