# Domain Management Roadmap

## ✅ Phase 1: Domain-Based Login Restriction (IMPLEMENTED)

### What Was Done

- **Hook Implementation**: `verifyDomainAccessHook` in users collection
  - Runs after login authentication (`afterLogin` hook)
  - Opt-in feature: only enforced when tenant has CMS domains configured
  - System users bypass the check
  - Clear error messages for unauthorized access

### How It Works

```typescript
// When a tenant has domains configured with pageTypes=['cms']:
domains: [
  { domain: 'cms.acme.com', pageTypes: ['cms'] },
  { domain: 'cms-acme.fly.dev', pageTypes: ['cms'] }
];

// Users can ONLY log in from those domains
// Trying to access from cms-demo.fly.dev → FORBIDDEN
```

### Benefits Over Previous Solution

- ✅ No post-login redirect (better UX)
- ✅ Prevents session creation for unauthorized domains
- ✅ Clean error messages
- ✅ Opt-in: tenants without domains still work normally
- ✅ Proper authentication flow (not a workaround)

---

## 🚧 Phase 2: DNS & Certificate Management (FUTURE)

### Goals

1. **Domain Verification**: Verify DNS configuration before allowing domain
2. **Certificate Status**: Monitor SSL certificate status and expiration
3. **Admin UI**: Manage custom domains through Payload admin
4. **Automation**: Automatic certificate provisioning via Fly API

### Proposed Implementation

#### 1. Extend Tenant Domain Schema

```typescript
// Add to tenants.collection.ts domains field
{
  name: 'domains',
  fields: [
    { name: 'domain', type: 'text' },
    { name: 'pageTypes', type: 'select', hasMany: true },

    // NEW FIELDS:
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending Verification', value: 'pending' },
        { label: 'DNS Verified', value: 'verified' },
        { label: 'Active', value: 'active' },
        { label: 'Failed', value: 'failed' }
      ],
      admin: { readOnly: true }
    },
    {
      name: 'dnsStatus',
      type: 'group',
      admin: { readOnly: true },
      fields: [
        { name: 'verified', type: 'checkbox' },
        { name: 'expectedCname', type: 'text' },
        { name: 'currentValue', type: 'text' },
        { name: 'lastChecked', type: 'date' }
      ]
    },
    {
      name: 'certificate',
      type: 'group',
      admin: { readOnly: true },
      fields: [
        { name: 'issuer', type: 'text' },
        { name: 'expiresAt', type: 'date' },
        { name: 'daysUntilExpiry', type: 'number' },
        { name: 'autoRenewEnabled', type: 'checkbox' }
      ]
    }
  ]
}
```

#### 2. DNS Verification Service

```typescript
// libs/app-cms/util/domain/verify-dns.ts
export async function verifyDNS(domain: string, expectedCname: string) {
  // Use DNS lookup library or service
  // Check if CNAME record points to expected target
  return {
    verified: boolean,
    currentValue: string,
    error?: string
  };
}
```

#### 3. Certificate Status via Fly API

```typescript
// packages/fly-node/src/lib/fly.class.ts
export class Fly {
  certificates = {
    /**
     * List certificates for an app
     */
    list: async (app: string) => {
      // fly certs list --app {app} --json
    },

    /**
     * Get certificate details for a specific hostname
     */
    show: async (app: string, hostname: string) => {
      // fly certs show {hostname} --app {app} --json
    },

    /**
     * Create a new certificate
     */
    create: async (app: string, hostname: string) => {
      // fly certs create {hostname} --app {app} --yes
    },

    /**
     * Remove a certificate
     */
    remove: async (app: string, hostname: string) => {
      // fly certs delete {hostname} --app {app} --yes
    }
  };
}
```

#### 4. Background Job for Status Updates

```typescript
// apps/cms/src/jobs/check-domain-status.job.ts
export async function checkDomainStatusJob(payload: Payload) {
  const tenants = await payload.find({
    collection: 'tenants',
    where: { 'domains.status': { not_equals: 'active' } },
    depth: 0
  });

  for (const tenant of tenants.docs) {
    for (const domain of tenant.domains || []) {
      // 1. Check DNS
      const dnsStatus = await verifyDNS(domain.domain, expectedCname);

      // 2. Check Certificate (if DNS verified)
      if (dnsStatus.verified) {
        const certStatus = await fly.certificates.show(appName, domain.domain);

        // 3. Update tenant document
        await payload.update({
          collection: 'tenants',
          id: tenant.id,
          data: {
            /* updated domain status */
          }
        });
      }
    }
  }
}
```

#### 5. Admin UI Components

```typescript
// Custom components for domain management
{
  name: 'domains',
  admin: {
    components: {
      Field: 'apps/cms/src/components/DomainManagementField',
      // Shows:
      // - DNS verification status with instructions
      // - Certificate status with expiry countdown
      // - "Verify DNS" button
      // - "Provision Certificate" button
      // - Help links for DNS setup
    }
  }
}
```

### Workflow Example

**Adding a Custom Domain:**

1. Admin adds domain `cms.client.com` to tenant
2. System shows: "DNS Verification Required"
   - Instruction: Add CNAME record: `cms.client.com → cms-acme.fly.dev`
   - "Verify DNS" button
3. Admin configures DNS, clicks "Verify DNS"
4. System checks DNS, updates status to "DNS Verified"
5. "Provision Certificate" button appears
6. Admin clicks button → Fly API creates cert → Status: "Active"
7. Background job monitors cert expiry (auto-renew via Fly)

### Benefits

- ✅ Self-service domain management
- ✅ Prevent misconfigured domains from breaking login
- ✅ Proactive certificate expiry warnings
- ✅ Better tenant onboarding experience
- ✅ Audit trail of domain changes

### Complexity Assessment

- **DNS Verification**: Medium (requires DNS lookup library or service)
- **Fly API Integration**: Medium (extend existing Fly class)
- **Background Jobs**: Medium (setup cron or Payload jobs)
- **Admin UI**: High (custom React components)
- **Overall**: Large feature (2-3 weeks of focused work)

### Recommendation

Start with Phase 1 (implemented above). Phase 2 can be added later when:

- You have multiple tenants with custom domains
- Manual domain setup becomes a bottleneck
- You need better visibility into domain/cert status

---

## Migration Path

**Current State → Phase 1:**

- ✅ Domains collection field exists
- ✅ Seed data includes domains
- ✅ Add verification hook
- ✅ Update admin UI descriptions
- ✅ No database migration needed

**Phase 1 → Phase 2:**

- Add new fields to domains array (status, dnsStatus, certificate)
- Create migration to add default values
- Implement verification services
- Build admin UI components
- Setup background jobs

---

## Testing Strategy

### Phase 1 Testing

```typescript
describe('Domain-based login restriction', () => {
  it('should allow login from authorized domain', async () => {
    // Tenant with domains=['cms.acme.com']
    // Request from 'cms.acme.com'
    // → Success
  });

  it('should deny login from unauthorized domain', async () => {
    // Tenant with domains=['cms.acme.com']
    // Request from 'cms-demo.fly.dev'
    // → ForbiddenError
  });

  it('should allow login when no domains configured', async () => {
    // Tenant with domains=[]
    // Request from any domain
    // → Success (opt-in feature)
  });

  it('should allow system users from any domain', async () => {
    // System user
    // Request from any domain
    // → Success
  });
});
```

### Phase 2 Testing

```typescript
describe('DNS verification', () => {
  it('should verify valid CNAME record');
  it('should detect missing CNAME record');
  it('should update status after verification');
});

describe('Certificate management', () => {
  it('should fetch certificate status from Fly');
  it('should calculate days until expiry');
  it('should provision new certificate');
});
```
