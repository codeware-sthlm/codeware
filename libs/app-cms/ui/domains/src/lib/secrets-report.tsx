import { CheckCircleIcon } from '@heroicons/react/24/outline';

export type SecretsReportProps = {
  report: {
    /** Every secret found pointing at the hostname */
    secrets: Array<{ path: string; key: string; isCorsTagged: boolean }>;
    /** Whether at least one of them makes the cms accept the domain */
    hasCors: boolean;
    /** Infisical could not be read, so "none found" would be a guess */
    unavailable: boolean;
  };
  labels: {
    corsTag: string;
    missing: string;
    unavailable: string;
    corsMissing: string;
  };
};

/**
 * What Infisical says about the domain, which the certificate cannot answer.
 *
 * A valid certificate only means Fly will terminate TLS for the hostname. The
 * app still has to be told to serve that url, and the cms still has to accept
 * it as an origin — both edited by hand in Infisical. Without this, a fully
 * issued certificate reads as "done" while the site returns nothing.
 */
export function SecretsReport({ report, labels }: SecretsReportProps) {
  if (report.unavailable) {
    return <p className="text-muted-foreground">{labels.unavailable}</p>;
  }

  if (!report.secrets.length) {
    return <p className="text-(--destructive-subtle)">{labels.missing}</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {report.secrets.map(({ path, key, isCorsTagged }) => (
        <span
          key={`${path}|${key}`}
          className="text-muted-foreground flex items-start gap-1.5 text-xs"
        >
          {/* A found secret is a step that is done, and reads as one */}
          <CheckCircleIcon className="size-4 shrink-0 text-(--success-subtle)" />
          <span className="break-all">
            <span className="font-mono">
              {path}/{key}
            </span>
            {isCorsTagged && ` · ${labels.corsTag}`}
          </span>
        </span>
      ))}
      {!report.hasCors && (
        <p className="text-(--destructive-subtle)">{labels.corsMissing}</p>
      )}
    </div>
  );
}
