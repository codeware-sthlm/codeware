import { Badge } from '@codeware/shared/ui/shadcn/components/badge';

export type IntegrationRowProps = {
  /** What the integration is for, e.g. "Email" */
  label: string;
  /**
   * Which provider answers for it, e.g. `sentry` or `smtp`.
   *
   * Doubles as the configured signal — no provider means nothing is wired up,
   * and the row says so instead.
   */
  provider?: string | null;
  /**
   * Which instance of that provider, e.g. an org slug or a bucket.
   *
   * Never a credential — an identifier and a host at most. A sheet reaches
   * further than the env file these values came from.
   */
  value?: string | null;
  /** Shown in place of the provider when nothing is configured */
  notConfiguredLabel: string;
};

/**
 * One integration and what it resolved to at start-up.
 *
 * The badge says *what* answers, the line beneath says *which* — a split worth
 * making because the second half is often a bucket plus an endpoint url, which
 * has no chance of sharing a line with its own label.
 */
export function IntegrationRow({
  label,
  provider,
  value,
  notConfiguredLabel
}: IntegrationRowProps) {
  return (
    <div className="border-border flex flex-col gap-1 border-b py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-foreground text-sm font-medium">{label}</span>
        {provider ? (
          <Badge variant="outline" className="font-mono">
            {provider}
          </Badge>
        ) : (
          <Badge variant="destructive">{notConfiguredLabel}</Badge>
        )}
      </div>
      {provider && value && (
        <span className="text-muted-foreground font-mono text-xs break-all">
          {value}
        </span>
      )}
    </div>
  );
}
