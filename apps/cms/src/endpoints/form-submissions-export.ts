import {
  getForm,
  getFormSubmissions,
  mapToRuntime
} from '@codeware/app-cms/data-access';
import { isUser } from '@codeware/app-cms/util/misc';
import { resolveSubmissionFields } from '@codeware/shared/util/payload-utils';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import type { Endpoint, PayloadRequest } from 'payload';

import { getTenantWhereFromHeaders } from '../components/admin/utils/tenant-where';

/**
 * Cap on exported rows. A form with more replies than this needs a background
 * job rather than a request-scoped export.
 */
const MAX_ROWS = 5000;

/** Excel reads a UTF-8 csv as latin-1 unless it starts with a byte order mark */
const BOM = '﻿';

/**
 * Leading characters a spreadsheet reads as the start of a formula.
 *
 * Tab and carriage return are included because leading whitespace is skipped
 * before the next character is interpreted.
 */
const FORMULA_LEAD = /^[=+\-@\t\r]/;

/**
 * RFC 4180 field: always quoted, embedded quotes doubled.
 *
 * Values come from anonymous visitors and this file is built to be opened in
 * Excel, so anything that looks like a formula is prefixed with an apostrophe
 * first. Quoting alone is no defence — the reader strips the quotes and still
 * evaluates `=…`, which is how a submitted `=HYPERLINK(…)` would run on the
 * editor's machine. Excel treats the apostrophe as "this is text" and does not
 * display it.
 */
const csvField = (value: string) => {
  const safe = FORMULA_LEAD.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
};

const csvRow = (values: Array<string>) => values.map(csvField).join(',');

/**
 * Filename-safe slug of the form title, so downloads don't all collide.
 */
function toFileSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'form';
}

/**
 * Export one form's submissions as CSV.
 *
 * Scoped to a single form because the columns are the form's own fields —
 * a cross-form export would be a sparse union no spreadsheet reader wants.
 * Columns follow the form's field order and use its labels, with any value
 * whose field has since been removed appended in trailing columns.
 *
 * Reads run under the caller's own access control and workspace scope, so an
 * editor can only export the forms they can already open.
 */
export const formSubmissionsExportEndpoint: Endpoint = {
  path: '/form-submissions-export',
  method: 'get',
  handler: async (req: PayloadRequest): Promise<Response> => {
    if (!isUser(req.user)) {
      return Response.json(
        { error: getReasonPhrase(StatusCodes.FORBIDDEN) },
        { status: StatusCodes.FORBIDDEN }
      );
    }

    const formId = Number(req.query?.['form']);
    if (!Number.isInteger(formId) || formId <= 0) {
      return Response.json(
        { error: 'A `form` query parameter is required' },
        { status: StatusCodes.BAD_REQUEST }
      );
    }

    try {
      const tenantWhere = getTenantWhereFromHeaders(req.headers, req.user);
      const runtime = mapToRuntime(req.payload, req.user);

      const form = await getForm(runtime, formId);

      if (!form) {
        return Response.json(
          { error: getReasonPhrase(StatusCodes.NOT_FOUND) },
          { status: StatusCodes.NOT_FOUND }
        );
      }

      const submissions = await getFormSubmissions(runtime, {
        where: {
          and: [
            { form: { equals: formId } },
            ...(tenantWhere ? [tenantWhere] : [])
          ]
        },
        limit: MAX_ROWS
      });

      const rows = (submissions?.docs ?? []).map((doc) => ({
        createdAt: doc.createdAt,
        fields: resolveSubmissionFields(form, doc.submissionData)
      }));

      // Column order follows the form; orphaned fields are appended in the
      // order they are first met so every value still lands in the file
      const columns: Array<{ name: string; label: string }> = [];
      const seen = new Set<string>();
      for (const row of rows) {
        for (const field of row.fields) {
          if (!seen.has(field.name)) {
            seen.add(field.name);
            columns.push({ name: field.name, label: field.label });
          }
        }
      }
      columns.sort((a, b) => {
        const orderOf = (name: string) =>
          (form.fields ?? []).findIndex(
            (field) => 'name' in field && field.name === name
          );
        const [orderA, orderB] = [orderOf(a.name), orderOf(b.name)];
        // Orphaned fields (-1) sort last, keeping their first-seen order
        if (orderA === orderB) return 0;
        if (orderA === -1) return 1;
        if (orderB === -1) return -1;
        return orderA - orderB;
      });

      const csv = [
        csvRow(['Received', ...columns.map((column) => column.label)]),
        ...rows.map((row) => {
          const values = new Map(
            row.fields.map((field) => [field.name, field.value])
          );
          return csvRow([
            row.createdAt,
            ...columns.map((column) => values.get(column.name) ?? '')
          ]);
        })
      ].join('\r\n');

      const filename = `${toFileSlug(form.title)}-submissions-${new Date().toISOString().slice(0, 10)}.csv`;

      return new Response(`${BOM}${csv}`, {
        status: StatusCodes.OK,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    } catch (error) {
      req.payload.logger.error(
        `[formSubmissionsExport] Export failed: ${String(error)}`
      );
      return Response.json(
        { error: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR) },
        { status: StatusCodes.INTERNAL_SERVER_ERROR }
      );
    }
  }
};
