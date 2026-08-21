/**
 * Hosts that mean "a developer's mail catcher", not a relay to the internet.
 *
 * `mailpit` is here as well as the loopback addresses because a catcher run
 * from compose is reached by its service name.
 */
const CATCHER_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'mailpit']);

/**
 * Whether an SMTP host is a local mail catcher rather than a real relay.
 *
 * Two callers depend on this and would drift apart without a shared answer:
 * the email adapter, which may only drop TLS for a catcher, and the platform
 * dashboard, which calls production mail into a catcher a misconfiguration.
 *
 * @param host - SMTP host, as configured
 * @returns `true` for a known catcher host
 */
export const isCatcherHost = (host: string | null | undefined): boolean =>
  Boolean(host && CATCHER_HOSTS.has(host.toLowerCase()));
