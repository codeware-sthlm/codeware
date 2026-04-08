# CMS Permission Model

> **Source of truth for e2e permission tests.**
> Each scenario is identified by an ID (e.g. `[T-01]`) that test descriptions reference directly.

## User Types

The CMS has two independent role dimensions that combine to define effective permissions.

### `users.role` — system level

| Value         | Who                                                            |
| ------------- | -------------------------------------------------------------- |
| `system-user` | Full system access. No tenant membership required or expected. |
| `user`        | All other users. Must belong to at least one tenant workspace. |

### `tenants[].role` — per-membership level

| Value   | Who                                                                         |
| ------- | --------------------------------------------------------------------------- |
| `admin` | Can manage users within the workspace (create, edit tenants array, delete). |
| `user`  | Read and write content within the workspace. Cannot manage users.           |

### Effective user types

These three personas are what the tests exercise:

| Persona          | `users.role`  | `tenants[].role`    | Description                                     |
| ---------------- | ------------- | ------------------- | ----------------------------------------------- |
| **System user**  | `system-user` | —                   | Manages the whole platform. No tenant scope.    |
| **Tenant admin** | `user`        | `admin` (≥1 tenant) | Manages users and content within their tenants. |
| **Tenant user**  | `user`        | `user` (≥1 tenant)  | Creates and edits content. Cannot manage users. |

---

## How Access Is Determined

### Tenants collection

Only system users can create, update, or delete tenants. Read is restricted to the active tenant in tenant mode.

### Users collection

- **Create**: system user or tenant admin (admin can only create users for their own tenants).
- **Read**: any authenticated user, constrained to users who share at least one tenant with the requester. System users see all.
- **Update**: system user (all), tenant admin (users whose every tenant membership the admin controls), self (own profile only).
- **Delete**: system user (all), tenant admin (users in their tenants — cannot delete self).
- **`users.role` field**: create/update restricted to system users only. Tenant admins cannot escalate privileges.
- **`tenants[]` array**: tenant admins cannot assign users to tenants they do not administer, nor change roles in those tenants.

### Content collections (pages, posts, categories, navigation, site-settings, tags, media, reusable-content)

- **Read**: any authenticated user or valid tenant API key, scoped to the active tenant (`payload-tenant` cookie).
- **Update navigation / site-settings**: system user or tenant admin only. Tenant users are denied.
- **Create / delete**: any authenticated user within their tenant scope.

### Multi-tenant cookie scoping (`payload-tenant`)

The `payload-tenant` cookie is read on **every API request** for plugin-managed content collections. Setting it to a specific tenant ID restricts all results to that tenant, even for users with multi-tenant access. This applies at the REST API level, not just the admin UI.

### Tenant-mode login restriction

After password auth, the `verifyTenantModeAccessHook` (afterLogin) checks that the user belongs to the active tenant when the server is running in tenant mode. Skipped for `system-user` and users with no tenant memberships. Users who fail this check receive a 403 before any session token is issued.

---

## Test Users

All users are seeded by `libs/shared/util/seed/src/lib/static-data/seed.development.ts`.
Password for every seed user: **`dev`** (blank in seed data, defaulted to `dev` at runtime).

| Constant      | Email               | Persona      | Tenants               | Primary test purpose                                |
| ------------- | ------------------- | ------------ | --------------------- | --------------------------------------------------- |
| `systemUser`  | `system@local.dev`  | System user  | none                  | System-only operations; setup/teardown              |
| `tenantAdmin` | `titan@local.dev`   | Tenant admin | moon (admin)          | Core tenant admin permission tests                  |
| `tenantUser`  | `phobos@local.dev`  | Tenant user  | moon (user)           | Core tenant user permission tests                   |
| `multiAdmin`  | `black@local.dev`   | Tenant admin | moon+star+sun (admin) | Multi-tenant admin; cookie-scoped content isolation |
| `multiUser`   | `iss@local.dev`     | Tenant user  | moon+star+sun (user)  | Multi-tenant user; cookie-scoped content isolation  |
| `otherAdmin`  | `antares@local.dev` | Tenant admin | star (admin)          | No moon access — verifies cross-tenant denial       |

> **`otherAdmin` is the primary "no access" actor** for moon-scoped tests. They are a valid admin
> in a different tenant, so any denial is specifically about moon access, not about being unauthenticated.

---

## Permission Matrix

`✓` = allowed · `✗` = denied · `~` = partial (see notes)

### Tenants collection

| Scenario                | System user | Tenant admin                | Tenant user                 |
| ----------------------- | ----------- | --------------------------- | --------------------------- |
| [T-01] Create tenant    | ✓           | ✗                           | ✗                           |
| [T-02] Read tenant list | ✓           | ~ (own only in tenant mode) | ~ (own only in tenant mode) |
| [T-03] Update tenant    | ✓           | ✗                           | ✗                           |
| [T-04] Delete tenant    | ✓           | ✗                           | ✗                           |

### Users collection

| Scenario                                                | System user | Tenant admin                 | Tenant user                  |
| ------------------------------------------------------- | ----------- | ---------------------------- | ---------------------------- |
| [U-01] Create user                                      | ✓           | ✓ (own tenants only)         | ✗                            |
| [U-02] Read user list                                   | ✓ (all)     | ~ (shared-tenant users only) | ~ (shared-tenant users only) |
| [U-03] Update own profile                               | ✓           | ✓                            | ✓                            |
| [U-04] Update another user's basic fields (same tenant) | ✓           | ✓                            | ✓ (basic fields only)        |
| [U-04b] Change another user's tenant memberships        | ✓           | ✓ (own tenants)              | ✗                            |
| [U-05] Update user in non-admin tenant                  | ✓           | ✗                            | ✗                            |
| [U-06] Delete user (not self)                           | ✓           | ✓ (own tenants)              | ✗                            |
| [U-07] Delete self                                      | ✓           | ✗                            | ✗                            |
| [U-08] Set `users.role` to `system-user`                | ✓           | ✗                            | ✗                            |
| [U-09] Assign user to non-admin tenant                  | ✓           | ✗                            | ✗                            |
| [U-10] Read users outside own tenants                   | ✓           | ✗                            | ✗                            |

### Content collections (pages, posts, categories, etc.)

| Scenario                                                   | System user | Tenant admin | Tenant user | No moon access |
| ---------------------------------------------------------- | ----------- | ------------ | ----------- | -------------- |
| [C-01] Read moon content                                   | ✓           | ✓            | ✓           | ✗              |
| [C-02] Create moon content                                 | ✓           | ✓            | ✓           | ✗              |
| [C-03] Update navigation                                   | ✓           | ✓            | ✗           | ✗              |
| [C-04] Update site-settings                                | ✓           | ✓            | ✗           | ✗              |
| [C-05] Multi-tenant user restricted to moon in tenant mode | ✓           | ✓            | ✓           | —              |

> **No moon access column:** All denials happen at login — `verifyTenantModeAccessHook` rejects
> users without moon membership before a session token is issued. See `auth.spec.ts`.
>
> **Defense-in-depth (C-02):** Even if login were bypassed, the multi-tenant plugin overrides any
> injected `tenant` body field with the cookie-derived value, so content can never land in a tenant
> the user doesn't own.
>
> **[C-05] note:** In tenant mode `userOrApiKeyAccess` returns `{ tenant: equals moonId }` for all
> authenticated users. The plugin AND's this with `{ tenant: in userTenantIds }`. Multi-tenant users
> (e.g. `multiAdmin` with moon+star+sun) therefore only receive moon content — server-enforced,
> independent of the `payload-tenant` cookie.

---

## Implementation Notes

- All `[T-*]`, `[U-*]`, `[C-*]` tests are **API-level** (`page.request`, `{ navigate: false }`) — faster and more precise, no admin page load interference.
- Browser/UI tests that verify admin menu visibility or tenant selector behaviour live in `src/admin/`.
- `otherAdmin` (`antares@local.dev`) represents the "no moon access" column. Because login is denied in tenant mode, their role is exercised exclusively in `auth.spec.ts`.
- Cookie-scope tests (S-series) are only meaningful in host mode and are not part of this e2e suite.
