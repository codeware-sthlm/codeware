import { parseWithZod } from '@conform-to/zod';
import { data } from '@remix-run/react';
import { z } from 'zod';

import { setTheme } from '../utils/theme.server';
import type { TypedActionFunctionArgs } from '../utils/types';

/** Where the theme is persisted. Submitted to from `root.tsx`. */
export const THEME_ACTION = '/resources/theme-switch';

const ThemeFormSchema = z.object({
  // Not an enum: a future theme studio serves themes unknown at build time
  theme: z.string().min(1)
});

export async function action({ context, request }: TypedActionFunctionArgs) {
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: ThemeFormSchema });
  if (submission.status !== 'success') {
    throw data('Invalid theme received', { status: 400 });
  }

  const { theme } = submission.value;

  // Only a theme the tenant currently offers may be stored, so a crafted or
  // stale value never reaches the cookie
  if (!(context.tenantConfig?.themes ?? []).includes(theme)) {
    throw data('Theme not available for this tenant', { status: 400 });
  }

  return data(
    { result: submission.reply() },
    { headers: { 'set-cookie': await setTheme(theme) } }
  );
}
