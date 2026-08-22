'use client';

import type {
  TranslationsKeys,
  TranslationsObject
} from '@codeware/app-cms/util/i18n';
import { isBlank } from '@codeware/shared/util/pure';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useFormFields, useTranslation } from '@payloadcms/ui';
import Link from 'next/link';
import React from 'react';

type Props = {
  /** The tenant's configured generic recipients, already resolved server-side */
  recipients: Array<string>;
  /** Site settings document url, or null when this user may not edit it */
  settingsHref: string | null;
};

/** Matches the plugin's array path for each notification email's recipient */
const EMAIL_TO_PATH = /^emails\.\d+\.emailTo$/;

/**
 * States where an unaddressed notification email will go, or warns there is
 * nowhere for it to go — only while at least one email on this form is
 * missing its own `emailTo`.
 *
 * Reads form state directly rather than the saved document, so the hint
 * tracks the editor clearing a recipient or adding a fresh email row in the
 * same sitting, not just what was last saved. A boolean selector rather than
 * the whole fields object, so this only re-renders when the answer flips —
 * not on every keystroke elsewhere in the form.
 */
export const FormNotificationRecipient: React.FC<Props> = ({
  recipients,
  settingsHref
}) => {
  const { t } = useTranslation<TranslationsObject, TranslationsKeys>();

  const missingRecipient = useFormFields(([fields]) =>
    Object.entries(fields).some(
      ([path, field]) =>
        EMAIL_TO_PATH.test(path) && isBlank(field?.value as string | undefined)
    )
  );

  if (!missingRecipient) {
    return null;
  }

  const hasGenericRecipient = recipients.length > 0;

  return (
    <div className="codeware-admin twp border-border text-muted-foreground mb-3 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm">
      <ExclamationTriangleIcon
        className={
          hasGenericRecipient
            ? 'size-4 shrink-0 text-(--warning-subtle)'
            : 'size-4 shrink-0 text-(--destructive-subtle)'
        }
      />
      {hasGenericRecipient ? (
        <span>
          {t('forms:notificationRecipient', {
            recipients: recipients.join(', ')
          })}
        </span>
      ) : (
        <span className="text-(--destructive-subtle)">
          {t('forms:notificationRecipientMissing')}
        </span>
      )}
      {settingsHref && (
        <Link className="underline" href={settingsHref} prefetch={false}>
          {t('forms:notificationSettingsLink')}
        </Link>
      )}
    </div>
  );
};

export default FormNotificationRecipient;
