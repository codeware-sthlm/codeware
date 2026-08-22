import type { TranslationsKeys } from '@codeware/app-cms/util/i18n';
import type { FormSubmission } from '@codeware/shared/util/payload-types';
import type { TFunction } from '@payloadcms/translations';

/**
 * The two `notificationStatus` values worth flagging to an admin.
 *
 * `not-configured` and `sent` are the quiet, working states; `null` predates
 * the field entirely. Only these two say the submission needs a look.
 */
export type NotificationIssue = 'failed' | 'no-recipient';

/** Narrows a stored `notificationStatus` to the two states worth flagging */
export const toNotificationIssue = (
  status: FormSubmission['notificationStatus']
): NotificationIssue | undefined =>
  status === 'failed' || status === 'no-recipient' ? status : undefined;

/**
 * Badge text for a flagged submission — shared by the list row and its
 * document view, which use the same `t` shape from different sides of the
 * server/client boundary (`customT(i18n.t)` vs. `useTranslation`'s `t`).
 */
export const notificationIssueLabel = (
  t: TFunction<TranslationsKeys>,
  issue: NotificationIssue
): string =>
  issue === 'failed'
    ? t('formSubmissions:notificationFailed')
    : t('formSubmissions:notificationNoRecipient');

/**
 * Alert text for a flagged submission's detail — worded to tell an outage
 * (`failed`) apart from a settings problem the admin can fix (`no-recipient`).
 */
export const notificationIssueMessage = (
  t: TFunction<TranslationsKeys>,
  issue: NotificationIssue
): string =>
  issue === 'failed'
    ? t('formSubmissions:notificationFailedDetail')
    : t('formSubmissions:notificationNoRecipientDetail');
