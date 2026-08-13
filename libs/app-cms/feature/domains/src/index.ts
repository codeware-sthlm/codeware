export {
  type AdoptableDomains,
  adoptableDomains
} from './lib/adoptable-domains';
export {
  type CertificateState,
  applyCertificateState,
  toCertificateState
} from './lib/certificate-state';
export {
  type DomainSecret,
  type DomainSecretsReport,
  findDomainSecrets
} from './lib/find-domain-secrets';
export { getFlyApi } from './lib/get-fly-api';
export { matchesDomain } from './lib/match-domain-secret';
export { guardDomainConflicts } from './lib/guard-domain-conflicts';
export { normalizeDomains } from './lib/normalize-domains';
export {
  type HostnameProblem,
  type HostnameResult,
  parseHostname
} from './lib/parse-hostname';
export type { TenantDomain, TenantWithDomains } from './lib/tenant-domain';
export { validateHostname } from './lib/validate-hostname';
