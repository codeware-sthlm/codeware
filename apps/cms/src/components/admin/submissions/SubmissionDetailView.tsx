import { getForm, mapToRuntime } from '@codeware/app-cms/data-access';
import { SubmissionDetail } from '@codeware/app-cms/ui/submissions';
import { customT } from '@codeware/app-cms/util/i18n';
import type { FormSubmission } from '@codeware/shared/util/payload-types';
import { resolveSubmissionFields } from '@codeware/shared/util/payload-utils';
import { getTranslation } from '@payloadcms/translations';
import { Gutter, SetStepNav } from '@payloadcms/ui';
import type { DocumentViewServerProps, TypedLocale } from 'payload';
import React from 'react';

import { MarkReadOnMount } from './MarkReadOnMount.client';

/**
 * Read-only document view for a single form submission.
 *
 * The list view opens submissions in a sheet, so this is the direct-link and
 * browser-back route into the same content. Payload's default edit view would
 * render `submissionData` as an array of text inputs that can never be saved
 * — submissions are immutable (`update: () => false`).
 */
const SubmissionDetailView: React.FC<DocumentViewServerProps> = async ({
  doc,
  i18n,
  initPageResult,
  locale,
  payload,
  user
}) => {
  const t = customT(i18n.t);
  const submission = doc as FormSubmission;
  const runtime = mapToRuntime(payload, user);
  const adminRoute = payload.config.routes?.admin ?? '/admin';
  const collectionConfig = initPageResult?.collectionConfig;
  const slug = collectionConfig?.slug ?? 'form-submissions';

  const formId =
    typeof submission.form === 'number'
      ? submission.form
      : (submission.form?.id ?? null);

  const form = formId
    ? await getForm(runtime, formId, {
        locale: locale?.code as TypedLocale | undefined
      })
    : null;

  const fields = resolveSubmissionFields(form, submission.submissionData);
  const title = form?.title ?? t('formSubmissions:deletedForm');

  const collectionLabel = getTranslation(
    collectionConfig?.labels?.plural ?? slug,
    i18n
  );

  return (
    <div className="collection-default collection-default--form-submissions">
      {/* Opening a submission is what marks it read; the list does this from
          its sheet, and this route has to do the same or a direct link leaves
          the message unread forever */}
      {!submission.readAt && <MarkReadOnMount id={submission.id} />}
      <SetStepNav
        nav={[
          {
            label: collectionLabel,
            url: `${adminRoute}/collections/${slug}`
          },
          { label: title }
        ]}
      />
      <Gutter>
        {/* Payload's own header markup, kept outside the `twp` scope below —
            Tailwind's preflight resets `h1` inside it, which would drop the
            admin's heading styles the title is supposed to match */}
        <header className="list-header">
          <div className="list-header__content">
            <div className="list-header__title-and-actions">
              <h1 className="render-title">{title}</h1>
            </div>
          </div>
          <div className="list-header__after-header-content">
            {t('formSubmissions:received', {
              when: new Date(submission.createdAt).toLocaleString(i18n.language)
            })}
          </div>
        </header>

        <div className="codeware-admin twp text-foreground">
          <SubmissionDetail
            fields={fields}
            emptyLabel={t('formSubmissions:noValues')}
            orphanedLabel={t('formSubmissions:orphanedField')}
          />
        </div>
      </Gutter>
    </div>
  );
};

export default SubmissionDetailView;
