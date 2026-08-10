import Link from 'next/link';
import type { DefaultServerCellComponentProps } from 'payload';
import React from 'react';

/**
 * Submissions received by the form, linking into the filtered messages list.
 *
 * Counted per row rather than through a virtual field on `forms`, so the query
 * is paid only when this column renders — a virtual field would run on every
 * form read, including the site rendering a form block.
 *
 * Cell components get no `user`, so the count runs with `overrideAccess`. That
 * is not a widening: submissions are pinned to their form's tenant on create
 * (`verifyFormTenant`), so a form the viewer can already see in this list can
 * only be counting its own tenant's messages.
 */
export const SubmissionCountCell: React.FC<
  DefaultServerCellComponentProps<never, never>
> = async ({ payload, rowData }) => {
  const formId = rowData?.['id'];
  if (typeof formId !== 'number' && typeof formId !== 'string') {
    return null;
  }

  const { totalDocs } = await payload.count({
    collection: 'form-submissions',
    where: { form: { equals: formId } },
    overrideAccess: true
  });

  const adminRoute = payload.config.routes?.admin ?? '/admin';

  if (!totalDocs) {
    return <span className="text-muted-foreground">0</span>;
  }

  return (
    <Link
      href={`${adminRoute}/collections/form-submissions?form=${formId}`}
      prefetch={false}
    >
      {totalDocs}
    </Link>
  );
};

export default SubmissionCountCell;
