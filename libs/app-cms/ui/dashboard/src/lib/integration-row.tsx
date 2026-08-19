import { Badge } from '@codeware/shared/ui/shadcn/components/badge';

export type IntegrationRowProps = {
  /** What the integration is for, e.g. "Email" */
  label: string;
  /**
   * The resolved transport, e.g. `sendgrid` or `smtp · localhost`.
   *
   * Never a credential — the transport name and host are the whole of what
   * this is allowed to show. A sheet reaches further than the env file these
   * values came from.
   */
  value?: string | null;
  /** Shown in place of the value when nothing is configured */
  notConfiguredLabel: string;
};

/**
 * One integration and what it resolved to at start-up.
 *
 * Two lines rather than a label/value pair on one: the values are transport
 * identifiers that read as code, and squeezing them to the right of a label
 * left them looking like an afterthought next to the domain rows they sit
 * alongside.
 */
export function IntegrationRow({
  label,
  value,
  notConfiguredLabel
}: IntegrationRowProps) {
  return (
    <div className="border-border flex items-center justify-between gap-3 border-b py-3 last:border-b-0">
      <span className="text-foreground text-sm font-medium">{label}</span>
      {value ? (
        <span className="text-muted-foreground font-mono text-sm break-all">
          {value}
        </span>
      ) : (
        <Badge variant="destructive">{notConfiguredLabel}</Badge>
      )}
    </div>
  );
}
