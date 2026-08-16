import { CopyButton } from '@codeware/shared/ui/copy-button';

export type DnsRecordProps = {
  /** The domain the records are created for */
  hostname: string;
  /** Fly app that serves it, which the traffic record points at */
  app: string;
  /** What Fly wants for the ownership challenge */
  validation: {
    /** Hostname the record is created for */
    name?: string | null;
    /** What it points at */
    target?: string | null;
    /** Fly's own phrasing, for the cases it describes better than a CNAME row */
    instructions?: string | null;
    /** The domain itself rather than a subdomain, which cannot use a CNAME */
    isApex?: boolean;
  };
  /**
   * Value for the `_fly-ownership` TXT record, when Fly has offered one.
   *
   * Fly's fallback proof of ownership, for the cases where it cannot read the
   * app's address off the domain itself — no IPv6, or a proxy in front.
   */
  ownershipRecord?: string | null;
  labels: {
    trafficLede: string;
    validationLede: string;
    ownershipLede: string;
    /** Lede for Fly's prose, which is not always the validation record */
    instructionsLede: string;
    apexNote: string;
    nameHint: string;
    /** Accessible name for the copy button */
    copyRecord: string;
  };
};

/**
 * The dns records the domain's owner has to create, laid out to be copied into
 * a registrar.
 *
 * Two of them, and only one is optional — the reverse of what it looks like
 * from here. The traffic record is what makes the domain answer at all; the
 * challenge record only lets the certificate be issued ahead of it. Showing the
 * challenge alone would let a domain go green while resolving nowhere.
 */
export function DnsRecord({
  hostname,
  app,
  validation,
  ownershipRecord,
  labels
}: DnsRecordProps) {
  const { name, target, instructions, isApex } = validation;
  const hasChallenge = Boolean(name && target);

  return (
    <div className="bg-muted/40 flex flex-col gap-3 rounded-md px-3.5 py-3">
      <section className="flex flex-col gap-1.5">
        <p className="text-muted-foreground">{labels.trafficLede}</p>
        {isApex ? (
          // An apex needs addresses rather than a name, and Fly spells the
          // current ones out below
          <p className="text-muted-foreground">{labels.apexNote}</p>
        ) : (
          <Record
            name={hostname}
            target={`${app}.fly.dev`}
            copyLabel={labels.copyRecord}
          />
        )}
      </section>

      {hasChallenge ? (
        <section className="flex flex-col gap-1.5">
          <p className="text-muted-foreground">{labels.validationLede}</p>
          <Record
            name={name ?? ''}
            target={target ?? ''}
            copyLabel={labels.copyRecord}
          />
        </section>
      ) : (
        instructions && (
          // Fly falls back to prose when the record is not a plain CNAME, and
          // what it describes there is not always the challenge
          <section className="flex flex-col gap-1.5">
            <p className="text-muted-foreground">{labels.instructionsLede}</p>
            <p className="whitespace-pre-line">{instructions}</p>
          </section>
        )
      )}

      {ownershipRecord && (
        <section className="flex flex-col gap-1.5">
          <p className="text-muted-foreground">{labels.ownershipLede}</p>
          <Record
            type="TXT"
            name={`_fly-ownership.${hostname}`}
            target={ownershipRecord}
            copyLabel={labels.copyRecord}
          />
        </section>
      )}

      <p className="text-muted-foreground text-xs">{labels.nameHint}</p>
    </div>
  );
}

/** One record row, with its value ready to copy */
function Record({
  type = 'CNAME',
  name,
  target,
  copyLabel
}: {
  type?: 'CNAME' | 'TXT';
  name: string;
  target: string;
  copyLabel: string;
}) {
  return (
    <div className="relative pr-12">
      <div className="font-mono text-xs break-all">
        <div>
          {type} {name}
        </div>
        <div className="text-muted-foreground">→ {target}</div>
      </div>
      <CopyButton code={target} label={copyLabel} />
    </div>
  );
}
