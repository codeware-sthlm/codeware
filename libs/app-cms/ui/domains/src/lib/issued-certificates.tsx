export type IssuedCertificate = {
  /** Key type, e.g. `RSA` or `ECDSA` */
  type: string;
  /** Pre-formatted expiry, e.g. "15 November 2026" */
  expiresLabel: string;
  /** Set when the expiry is close enough to be worth saying out loud */
  expiringSoon?: boolean;
};

export type IssuedCertificatesProps = {
  certificates: Array<IssuedCertificate>;
  /** Who signed them, e.g. `lets_encrypt` */
  authority?: string | null;
  labels: {
    heading: string;
    /** Prefixes the authority, e.g. "issued by" */
    issuedBy: string;
  };
};

/**
 * The certificates Fly has actually issued for a domain.
 *
 * Normally two rows — Fly issues an RSA and an ECDSA certificate per hostname
 * — sharing one expiry and one authority. Laid out as rows rather than the
 * three-column table Fly's own dashboard uses: two of those columns hold the
 * same value on both rows, so a header costs more vertical space in a narrow
 * admin panel than the data it labels.
 */
export function IssuedCertificates({
  certificates,
  authority,
  labels
}: IssuedCertificatesProps) {
  if (!certificates.length) {
    return null;
  }

  return (
    <section className="flex flex-col gap-1.5">
      <p className="text-muted-foreground">{labels.heading}</p>
      {certificates.map((certificate) => (
        <div
          key={certificate.type}
          className="flex flex-wrap items-baseline gap-x-2 text-xs"
        >
          <span className="font-mono">{certificate.type}</span>
          <span
            className={
              certificate.expiringSoon
                ? 'text-(--warning-subtle)'
                : 'text-muted-foreground'
            }
          >
            {certificate.expiresLabel}
          </span>
        </div>
      ))}
      {authority && (
        <p className="text-muted-foreground text-xs">
          {labels.issuedBy} <span className="font-mono">{authority}</span>
        </p>
      )}
    </section>
  );
}
