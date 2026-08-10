import {
  getFormSubmissions,
  getForms,
  mapToRuntime
} from '@codeware/app-cms/data-access';
import type { SupportedLocale } from '@codeware/shared/util/i18n';
import { getTranslation } from '@payloadcms/translations';
import type { ListViewServerProps, Where } from 'payload';
import React from 'react';

import { getTenantWhere } from '../utils/tenant-where';

import { PAGE_SIZE } from './page-size';
import { SubmissionsList } from './SubmissionsList.client';
import { toSubmissionRows } from './to-submission-rows';

/** Forms offered in the filter; a workspace with more than this needs search */
const FORM_OPTIONS_LIMIT = 100;

/** Read a positive integer from a search param, else undefined */
function toPositiveInt(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

/**
 * Server-component list view for form submissions.
 *
 * Payload's default list is built around the raw `{ field, value }` storage
 * shape, which leaves it with no meaningful column. This replaces it with one
 * row per submission and pushes the full, read-only detail into a sheet.
 *
 * Filters live in the URL (`?form=`, `?unread=`, `?page=`) so a filtered list
 * is linkable — the Forms list links straight into a single form's messages.
 */
const SubmissionsListView: React.FC<ListViewServerProps> = async ({
  collectionConfig,
  i18n,
  locale,
  payload,
  searchParams,
  user
}) => {
  const runtime = mapToRuntime(payload, user);
  const tenantWhere = await getTenantWhere(user);

  const formId = toPositiveInt(searchParams?.['form']);
  const unreadOnly = searchParams?.['unread'] === 'true';
  const page = toPositiveInt(searchParams?.['page']) ?? 1;

  const where: Where = {
    and: [
      ...(tenantWhere ? [tenantWhere] : []),
      ...(formId ? [{ form: { equals: formId } }] : []),
      ...(unreadOnly ? [{ readAt: { exists: false } }] : [])
    ]
  };

  const localeCode = locale?.code as SupportedLocale | undefined;

  const [forms, submissions] = await Promise.all([
    getForms(runtime, {
      where: tenantWhere,
      limit: FORM_OPTIONS_LIMIT,
      locale: localeCode
    }),
    getFormSubmissions(runtime, {
      where,
      limit: PAGE_SIZE,
      page,
      locale: localeCode
    })
  ]);

  const formDocs = forms?.docs ?? [];
  const rows = toSubmissionRows(submissions?.docs ?? [], formDocs);

  return (
    <SubmissionsList
      rows={rows}
      formOptions={formDocs.map((form) => ({
        id: form.id,
        title: form.title
      }))}
      filter={{ formId: formId ?? null, unreadOnly, page }}
      totalDocs={submissions?.totalDocs ?? 0}
      totalPages={submissions?.totalPages ?? 1}
      collectionLabel={getTranslation(
        collectionConfig?.labels?.plural ?? 'form-submissions',
        i18n
      )}
    />
  );
};

export default SubmissionsListView;
