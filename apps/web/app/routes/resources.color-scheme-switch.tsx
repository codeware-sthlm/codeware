import { parseWithZod } from '@conform-to/zod';
import { ActionFunctionArgs } from '@remix-run/node';
import { data, redirect, useFetchers } from '@remix-run/react';
import { z } from 'zod';

import { setColorScheme } from '../utils/color-scheme.server';
import { useRequestInfo } from '../utils/request-info';

/** Where the color scheme is persisted. Submitted to from `root.tsx`. */
export const COLOR_SCHEME_ACTION = '/resources/color-scheme-switch';

// Resolve a reusable action type
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
  const colorSchemeFetcher = fetchers.find(
    (f) => f.formAction === COLOR_SCHEME_ACTION
  );

  if (colorSchemeFetcher && colorSchemeFetcher.formData) {
    const submission = parseWithZod(colorSchemeFetcher.formData, {
      schema: ColorSchemeFormSchema
    });

    if (submission.status === 'success') {
      return submission.value.colorScheme;
    }
  }
}
