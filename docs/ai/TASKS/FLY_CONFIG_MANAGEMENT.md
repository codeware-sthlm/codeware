# Fly Config Management Strategy

## Problem

Fly apps preserve custom remote configurations, but this prevents automated updates to base config (like health checks). Manual CLI updates are error-prone when dealing with dynamic deployment settings.

## Current Approach

- **New apps**: Use local `fly.toml` or `fly.production.toml`
- **Existing apps**: Preserve remote config (via `preferRemoteConfig: true`)
- **Downside**: Config improvements don't propagate to existing apps

## Solutions

### 1. Immediate: One-Time Migration Script ✅

Use `scripts/update-health-checks.sh` to apply health check changes to existing apps.

**Usage:**

```bash
./scripts/update-health-checks.sh
```

**Features:**

- Pulls current config from each app
- Updates health check path to `/api/health`
- Adds `grace_period = "10s"` if missing
- **Reuses existing Docker image** (no rebuild required for config-only changes)
- Prompts before applying each change

**When to use**: One-time config updates that need to be applied to all existing apps.

---

### 2. Long-Term Option A: Config Merge Strategy (Recommended)

Create a config merge mechanism that:

- Preserves custom per-app settings (VM size, secrets, env vars, regions)
- Updates base requirements (health checks, ports, processes)
- Can be run as part of deployment or manually

**Implementation steps:**

1. Define "protected" fields that should always match local config
2. Add optional `--update-config` flag to deployment action
3. Merge strategy:
   ```typescript
   remoteConfig = {
     ...remoteConfig,
     // Always override these from local config
     http_service: {
       ...remoteConfig.http_service,
       checks: localConfig.http_service.checks,
       internal_port: localConfig.http_service.internal_port
     }
   };
   ```

**Pros:**

- Automated
- Safe (only updates specific fields)
- Can be versioned

**Cons:**

- Requires development in deployment action

---

### 3. Long-Term Option B: Config Templates + Validation

Maintain config templates and validate deployed apps against them.

**Structure:**

```
apps/cms/
  fly.base.toml          # Base config (shared by all)
  fly.overrides.toml     # Optional per-app overrides
```

**Validation script** checks if deployed apps match base requirements:

```bash
pnpm nx validate-fly-config cms
# Outputs: ❌ cdwr-cms: Missing grace_period in health checks
```

**Pros:**

- Clear separation of base vs. custom config
- Easy to audit

**Cons:**

- Still requires manual action to fix drift

---

### 4. Long-Term Option C: Immutable Base + Custom Overrides

Only allow custom settings in specific areas:

- VM size/memory (in `[[vm]]`)
- Secrets
- Environment variables
- Regions

All other settings (health checks, ports, processes) come from version-controlled config.

**Enforcement:**

- CI validates that remote config matches base config for protected fields
- Deployment fails if drift detected
- Forces explicit config updates via code

**Pros:**

- Infrastructure as Code philosophy
- Prevents config drift
- All changes tracked in git

**Cons:**

- Less flexible for emergency fixes
- Requires discipline

---

## Recommended Approach

**Immediate:** Run `scripts/update-health-checks.sh` to fix current apps

**Short-term (1-2 weeks):**

1. Document which config fields are "base" vs "custom"
2. Add config validation to CI that warns about drift
3. Create `fly.base.toml` template

**Long-term (1-2 months):**
Implement Option A (Config Merge Strategy) with:

- `--sync-base-config` flag in deployment action
- Merges protected fields from local config to remote
- Runs automatically for new deployments
- Can be triggered manually for existing apps

**Example usage:**

```bash
# Deploy with config sync
pnpm nx deploy cms --sync-base-config

# Or via environment variable
SYNC_FLY_BASE_CONFIG=true pnpm nx deploy cms
```

---

## Migration Path

1. ✅ Create health check endpoint (`/api/health`)
2. ✅ Update fly config templates
3. **Run migration script** (`./scripts/update-health-checks.sh`)
4. Document base vs custom config fields
5. Add config validation to CI
6. Enhance deployment action with merge strategy
7. Enable auto-sync for future deployments

---

## Tips: Config-Only Deployments

When updating only configuration (health checks, VM size, environment variables) without code changes, you can reuse the existing Docker image to avoid unnecessary rebuilds.

**Get current image:**

```bash
fly status -a <app-name> --json | jq -r '.ImageRef'
```

**Deploy with existing image:**

```bash
fly deploy -a <app-name> --config fly.toml --image <image-ref>
```

**Benefits:**

- Much faster (seconds vs minutes)
- No source code needed
- Preserves exact same image
- Useful for rollbacks

**Example:**

```bash
# Save current image
IMAGE=$(fly status -a cdwr-cms --json | jq -r '.ImageRef')

# Update config file (health checks, VM size, etc.)
vim fly.toml

# Deploy config-only change
fly deploy -a cdwr-cms --config fly.toml --image "$IMAGE"
```

This is exactly what `scripts/update-health-checks.sh` does automatically.
