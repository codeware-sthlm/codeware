import Link from 'next/link';
import type { DefaultServerCellComponentProps } from 'payload';

import { TenantIcon } from '@codeware/shared/ui/cms-renderer';
import type {
  Tenant,
  TenantIconConfig
} from '@codeware/shared/util/payload-types';

/**
 * Renders the tenant name with its icon in the list view cell.
 *
 * Reads `iconConfig` so both the icon and the name appear in a single linked column.
 */
export const TenantIconNameCell: React.FC<
  DefaultServerCellComponentProps<never, string>
> = ({ cellData: tenantName, collectionSlug, link, payload, rowData }) => {
  const tenant = rowData as Tenant;
  const iconConfig = tenant.iconConfig as TenantIconConfig | null;

  const content = (
    <span className="flex items-center gap-4">
      {iconConfig && (
        <span
          className={
            iconConfig.source === 'svg'
              ? 'line-height-0 block shrink-0'
              : 'shrink-0 object-contain'
          }
        >
          <TenantIcon config={iconConfig} size={20} />
        </span>
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
