# COD-440 — Retire CUSTOM_URL: cut Infisical over to platform-settings

Branch `cod-440-retire-custom_url-cut-infisical-over-to-platform-settings`. Follow-up to
[COD-436](https://linear.app/codeware/issue/COD-436), which built `platform-settings` and
`DISABLE_DOMAIN_ADOPTION` but deliberately stopped short of the live cutover.

## Split: manual cutover vs. code removal

Steps 1–5 are **Infisical secret edits against production**, not code changes — no PR, no
branch needed for those. Per standing practice, production-secret changes and restarts are
the user's to run directly; I'll prepare exact before/after values and checks for each step
but won't execute them myself. Step 6 (code removal) is the only part that goes through a
normal branch and PR.

## Status

Step 6 (code removal) done on this branch, **not merged**. Steps 1–5 (Infisical cutover)
not started — this branch must not merge/deploy until they are, see the merge gate below.

| Step | What              | State             |
| ---- | ----------------- | ----------------- |
| 1–5  | Infisical cutover | Not started       |
| 6    | Code removal      | Done, branch open |

## Merge gate — read before merging this branch

Removing `CUSTOM_URL` from `EnvSchema` makes Zod silently drop any leftover `CUSTOM_URL`
env/secret value instead of erroring — so a still-set value doesn't fail loudly, it just
stops being read. Cross-checked against each row in the cutover table:

- **Rows 1, 2, 3, 5** — safe in either order. Row 1 is dead config already. Row 2 is already
  `""` (falsy — behaves the same read or not). Row 3's `CUSTOM_URL` is already decorative:
  `adoptTenantDomains` only ever gated `serverURL` on it, and `demo`'s adopted domain already
  names the same host, so losing the gate early changes nothing observable. Row 5 is a preview
  secret, isolated from production.
- **Row 4 (`_default`) is the one that is not safe to reorder.** Its `CUSTOM_URL` is still
  the _only_ thing pointing `cms.codeware.se` at this deployment — no `platform-settings` row
  exists for it yet. If this branch merges and deploys before row 4's cutover is done, boot
  loses the `!env.CUSTOM_URL` gate, `adoptPlatformDomains` finds no row, and `serverURL` falls
  straight to `FLY_URL` — the host cms silently stops identifying as `cms.codeware.se` the
  moment this deploys, not when someone chooses to flip it.

**Do not merge this branch until row 4 of the cutover table is confirmed complete**: a
`platform-settings` row for the host Fly app naming `cms.codeware.se`, a certificate issued
and validated through the panel, the row marked primary, and `CUSTOM_URL` already cleared for
`production / cms / _default` with the app confirmed serving correctly on its own. Rows 1–3
and 5 are safe to do before or after merging this branch — only row 4's ordering matters.

## Cutover order (steps 1–5, user-run)

Clearing a value activates the database row behind it — each is a cutover, not a tidy-up.
Watch the app come back on the right URL after each before moving to the next. Re-verify the
table below against current Infisical state before starting (last checked 2026-08-17).

| #   | Env        | App | Tenant       | Current value                    | Action                                                                                                                                                                                          |
| --- | ---------- | --- | ------------ | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | production | web | `demo`       | `https://demo-remix.codeware.se` | Delete. Dead config — `apps/web`'s env schema only has `PAYLOAD_URL`, nothing reads this.                                                                                                       |
| 2   | production | cms | `ks-vininfo` | `""`                             | Delete the empty key. Adoption already live (empty string is falsy).                                                                                                                            |
| 3   | production | cms | `demo`       | `https://demo.codeware.se`       | Confirm the admin's primary domain row says `demo.codeware.se`, then clear. Adoption takes over on next restart.                                                                                |
| 4   | production | cms | `_default`   | `https://cms.codeware.se`        | **Host cutover.** Create a `platform-settings` row with `cms.codeware.se` against the host Fly app first, issue a certificate through the panel, mark it primary. Only then clear the variable. |
| 5   | preview    | cms | `demo`       | `https://pr-test.codeware.se`    | Stored as a _secret_, not env — edited in a different Infisical view.                                                                                                                           |

Step 4 is the ticket's headline case and the only one with real user-facing risk: getting it
wrong moves `cms.codeware.se` traffic before a certificate is ready. Do it last, once 1–3 have
confirmed the mechanism works.

## Step 6: code removal (branch + PR, after 1–5 confirmed)

- Remove `CUSTOM_URL` from `EnvSchema`.
- Remove it from `APP_MODE.serverURL`'s fallback chain.
- In `adoptTenantDomains` / `adoptPlatformDomains`, collapse the
  `!env.CUSTOM_URL && !env.DISABLE_DOMAIN_ADOPTION` gate down to `!env.DISABLE_DOMAIN_ADOPTION`.
- `docs/DEPLOYMENT.md` — drop `CUSTOM_URL` from examples.
- `apps/web` needs no code change (never read `CUSTOM_URL`).
- `nx affected -t lint typecheck`, `nx run cms:build`, `nx test cms`.
- Ask the user to run `nx verify cms` / `nx test-migrate cms` if either is implicated
  (unlikely — no migration in this step).

## Out of scope

`MAINTENANCE_MODE` stays in env — read in `proxy.ts` middleware, has to work when the
database is what's broken.

## Reference

Full original analysis: `docs/ai/TASKS/COD-436-platform-settings.md`, sections "What
Infisical actually holds" and step 7.
