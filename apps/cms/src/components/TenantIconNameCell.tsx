import Link from 'next/link';
import type { DefaultServerCellComponentProps } from 'payload';

import { InlineIcon } from '@codeware/shared/ui/primitives';
import type { Tenant } from '@codeware/shared/util/payload-types';

/**
 * Renders the tenant name with its icon in the list view cell.
 *
 * Reads `iconSource` so both the icon and the name appear in a single linked column.
 */
export const TenantIconNameCell: React.FC<
  DefaultServerCellComponentProps<never, string>
> = ({ cellData: tenantName, collectionSlug, link, payload, rowData }) => {
  const tenant = rowData as Tenant;
  const iconSource = tenant.iconSource?.trim() ?? '';

  const isSvg = iconSource.startsWith('<');

  const content = (
    <span className="flex items-center gap-4">
      {iconSource && isSvg && (
        <span className="line-height-0 block shrink-0">
          <InlineIcon svgCode={iconSource} size={20} />
        </span>
      )}
      {iconSource && !isSvg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconSource}
          alt="tenant icon"
          width={20}
          height={20}
          className="shrink-0 object-contain"
        />
      )}
      <span className="truncate">{tenantName}</span>
    </span>
  );

  if (link) {
    const adminRoute = payload.config.routes?.admin ?? '/admin';
    // linkURL omitted — Tenants has no formatDocURL, so it is always undefined
    const href = `${adminRoute}/collections/${collectionSlug}/${tenant.id}`;
    return (
      <Link href={href} prefetch={false}>
        {content}
      </Link>
    );
  }

  return content;
};

export default TenantIconNameCell;
