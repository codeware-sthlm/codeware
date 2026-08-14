import { CopyButton } from '@codeware/shared/ui/copy-button';

export type DnsRecordProps = {
  record: {
    /** Hostname the record is created for */
    name?: string | null;
    /** What it points at */
    target?: string | null;
    /** Fly's own phrasing, for the cases it describes better than a CNAME row */
    instructions?: string | null;
    /** The domain itself rather than a subdomain, which cannot use a CNAME */
    isApex?: boolean;
  };
  lede: string;
  apexNote: string;
  /** Accessible name for the copy button */
  copyLabel: string;
};

/**
 * The dns record the domain's owner has to create for the certificate to
 * validate, laid out to be copied into a registrar.
 */
export function DnsRecord({
  record,
  lede,
  apexNote,
  copyLabel
}: DnsRecordProps) {
  const { name, target, instructions, isApex } = record;
  const hasRecord = Boolean(name && target);

  if (!hasRecord && !instructions) {
    return null;
  }

  return (
    <div className="bg-muted/40 flex flex-col gap-2.5 rounded-md px-3.5 py-3">
      <p className="text-muted-foreground">{lede}</p>

      {hasRecord ? (
        <div className="relative pr-12">
          <div className="font-mono text-xs break-all">
            <div>CNAME {name}</div>
            <div className="text-muted-foreground">→ {target}</div>
          </div>
          <CopyButton code={target ?? ''} label={copyLabel} />
        </div>
      ) : (
        // Fly spells the same record out in prose, so it is a fallback rather
        // than a second copy of what is laid out above
        <p className="whitespace-pre-line">{instructions}</p>
      )}

      {isApex && <p className="text-muted-foreground">{apexNote}</p>}
    </div>
  );
}
