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

  const dropdownForms = forms?.docs ?? [];
  const submissionDocs = submissions?.docs ?? [];

  // The dropdown query is capped, so in a workspace with more forms than that
  // a row on this page — or the selected filter — can reference a form outside
  // it. Left alone those rows would render as "Deleted form" and the filter
  // would show blank, both of which are lies. Fetch exactly the stragglers.
  const knownIds = new Set(dropdownForms.map((form) => form.id));
  const neededIds = [
    ...new Set(
      [
        ...submissionDocs.map((doc) =>
          typeof doc.form === 'number' ? doc.form : doc.form?.id
        ),
        formId
      ].filter(
        (id): id is number => typeof id === 'number' && !knownIds.has(id)
      )
    )
  ];

  // Scoped like every other query here. Ids taken from the rows are in scope
  // already, but `formId` comes from the URL — without this, filtering by a
  // form in another workspace would surface its title in the dropdown.
  const extraForms = neededIds.length
    ? ((
        await getForms(runtime, {
          where: {
            and: [
              { id: { in: neededIds } },
              ...(tenantWhere ? [tenantWhere] : [])
            ]
          },
          limit: neededIds.length,
          locale: localeCode
        })
      )?.docs ?? [])
    : [];

  const rows = toSubmissionRows(submissionDocs, [
    ...dropdownForms,
    ...extraForms
  ]);

  // The selected form has to be offered even when it falls outside the capped
  // list, or the filter renders empty while filtering
  const selectedExtra = extraForms.filter((form) => form.id === formId);

  return (
    <SubmissionsList
      rows={rows}
      formOptions={[...dropdownForms, ...selectedExtra].map((form) => ({
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
