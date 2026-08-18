# COD-438 — Keep domain card details visible after the certificate validates

Rides on the [COD-440](https://linear.app/codeware/issue/COD-440) branch
`cod-440-retire-custom_url-cut-infisical-over-to-platform-settings` — same branch, same PR as
[COD-441](https://linear.app/codeware/issue/COD-441), at the user's explicit request. The diff
below is written against the **post-COD-441** state of `domain-card.tsx`: the `secrets` prop,
its render block and the `SecretsReport` import are already gone, and `NeedsAttention` has
already lost the two cards that existed to show the missing/untagged secret states.

Follow-up to [COD-357](https://linear.app/codeware/issue/COD-357), from live testing on
`pr-test.codeware.se`.

## Status

Steps 1–4 done. Step 5's label/lookup wiring landed alongside them (steps 2–4 don't
typecheck independently — the `labels` object is exhaustive, so each caller needs its match
before anything is green again); only step 5's new demonstration story cards are still open.

| Step | What                                          | State   |
| ---- | --------------------------------------------- | ------- |
| 1    | Stop trusting stored prose on an issued cert  | Done    |
| 2    | `DnsRecord` gains a settled voice             | Done    |
| 3    | `DomainCard` shows both blocks once requested | Done    |
| 4    | Translations + panel wiring                   | Done    |
| 5    | Stories, checks, commit                       | Partial |

`nx affected -t lint typecheck`, `nx run cms:build`, `cms` tests (11) and
`app-cms-feature-domains` tests (68) all pass.

## The bug

`domain-card.tsx` hides two blocks behind `!active`:

```tsx
{requested && !active && check?.issues?.length ? ( … ) : null}
{requested && !active && dns && <DnsRecord … />}
```

The moment `certificate.isConfigured` flips true, the suggested records, the confirmed
checkmarks, Fly's own validation prose and the ownership record all vanish at once. An active
card then carries nothing but a status line, `Checked …` and three buttons — including for the
one case that matters most, a domain that reads green and still does not load, which is exactly
the state COD-437's multi-resolver diagnostics would want a place to land in.

## What was verified

Read directly, on the current branch:

- **`DnsRecord` already does per-record confirmed state.** `confirmed.traffic` /
  `confirmed.validation` drive a green `CheckCircleIcon` per row
  (`libs/app-cms/ui/domains/src/lib/dns-record.tsx:84,96,144`). The all-or-nothing behaviour is
  purely the `!active` guard one level up; nothing inside `DnsRecord` needs a rewrite.
- **`confirmed` is session-only, and absent looks identical to unconfirmed.** The panel keeps
  `checks` in `useState` and never persists it (`DomainsPanel.client.tsx:147`), so on a fresh
  page load an active card has no `check` at all. `confirmed && <CheckCircleIcon/>` renders
  nothing for both `false` and `undefined`, so no tri-state is needed in the markup — but it does
  mean the settled block will _usually_ render with **no checkmarks at all**, which is why its
  copy must not read as a checklist. This is the constraint the ticket does not mention.
- **The traffic record does not come from Fly.** `DnsRecord` builds it from `hostname` + `app`
  (`→ ${app}.fly.dev`), so it renders for an active certificate whatever Fly returns. Only the
  challenge record and the apex/instructions prose come from stored `dnsValidation*` fields, and
  those degrade to nothing on their own if Fly stops returning them once issued (`hasChallenge`
  is `Boolean(name && target)`).
- **`describeCertificateIssues` does _not_ self-resolve to empty on an active certificate.**
  It returns `certificate.validationErrors` whenever that array is non-empty and only falls back
  to the live check's codes (`certificate-issues.ts:51-55`). `validationErrors` is Fly's
  `[{ message, timestamp }]` log of **failed issuance attempts**
  (`packages/fly-node/src/lib/schemas/certificate.schema.ts:49-60`), documented in
  `certificate-state.ts:15` as "oldest first" — a list with per-entry timestamps is a log, not a
  current-state field, and `toCertificateState` **discards the timestamps**
  (`.map((error) => error.message)`). So a domain that was misconfigured for an hour before the
  operator fixed dns keeps that prose after it validates, and the card has no way to age it out.
  Today the `!active` guard hides it; removing the guard naively would resurrect it as a red box
  on a healthy domain — the exact class of false positive COD-441 just deleted.
- **The live half stays meaningful after issuance.** `certs.check` is a `checkCertificate`
  mutation doing live dns resolution (`fly-api.class.ts:233-260`); it answers the same for an
  issued certificate as for a pending one and is the only source that can speak about _now_. That
  is the COD-437 signal.
- **But a live check on an active cert can report a benign failure.** Once issued, the
  `_acme-challenge` record is commonly deleted — the card's own `dnsValidationLede` calls it
  "Optional, and only worth adding to have the certificate issued before the domain points here"
  — so `acmeDnsConfigured` can read false and Fly can return a validation-dns code for a
  perfectly healthy domain.
- **No theme token exists for a warning tone.** Only `--destructive` / `--destructive-subtle`
  and `--success-subtle` (`libs/shared/theme/src/lib/*/theme-{light,dark}.css`). Adding one would
  touch four theme directories in both modes for a single box.
- **Nothing else is implicated.** No endpoint change (both certificate endpoints already return
  `certificate` + `check` for every action), no migration, no admin component added, removed or
  re-pathed, so no `generate:importmap` run.

## Decisions

**Show both blocks for every requested status; do not collapse.** The `!active` guard goes, and
neither block gets a `<details>`. A collapsed block would default to closed for precisely the
case the ticket exists to serve — a green card that does not load starts out _looking_ clean, so
whoever opens the panel to diagnose it would have to know to click first. Fly's own certificate
page keeps the setup permanently on screen; so does this. The card also stays hook-free and
presentational, which a collapsible would break.

**De-emphasize by changing voice, not by hiding.** An active card gets a different _lede_, not a
different amount of information. Pending copy is imperative — "Point the domain at the app.
Without this record the domain answers nowhere" — and reading that under a green "Active" badge
implies unfinished work that is not there. `DnsRecord` gains a `settled` flag that swaps the
three instruction ledes for one neutral line and drops the `dnsNameHint` footnote (only useful
while typing records into a registrar). Record rows, checkmarks and the ownership section are
untouched. Structurally identical, one voice quieter — and it costs exactly one new i18n key
rather than a parallel copy set.

**`settled = active && no issues`.** An active certificate that Fly still objects to has
something to act on, so it keeps the imperative setup voice. Settled is the genuinely finished
state only.

**On an issued certificate, ignore stored `validationErrors` and use only the live check.**
`describeCertificateIssues` gains the certificate's `isConfigured` and short-circuits on it.
Stored prose describes attempts that have since _succeeded_; keeping it would put a red box on
every domain that had a bumpy issuance, permanently, with the timestamps already thrown away by
`toCertificateState`. The live check is the only source with standing to speak about an issued
certificate. Note this is inference from Fly's schema shape, not an observation — the
verification list confirms it against a real active domain, and if Fly turns out to clear
`validationErrors` on success the guard is harmless.

**An active certificate's issues box is neutral, not destructive.** Same box, same heading
mechanics, but `--border` / `bg-muted/40` and a muted icon instead of the red tint, under its own
heading naming the state ("the certificate is issued, and Fly's last check still had this to
say"). With TLS issued and serving, nothing the check reports is fatal by definition, and the
most likely single finding is the deleted `_acme-challenge` record, which is a normal end state.
Red on a working domain is what COD-441 just finished removing.

> COD-441 rejected "keep it but style it as informational" for the Infisical report. That is not
> in tension: the report made a _false_ statement, and a neutral colour does not make a wrong
> statement right. Fly's live check makes a _true_ statement whose severity is what changes once
> the certificate is issued.

**Rejected: infer `confirmed.traffic` from `isConfigured`.** A certificate is issued when _a_
challenge succeeds, which is not the same as the traffic record pointing here — that gap is the
whole premise of COD-437 and of `dnsTrafficLede`. Fabricating a checkmark would hide the bug the
ticket is about.

**Rejected: filter known-benign Fly codes when active.** It means guessing at Fly's code
vocabulary and would silently swallow real findings when that vocabulary changes. Tone carries
the severity instead.

**Left alone: the `check` prop guard in the panel** (`row.check || issues.length`). With stale
prose suppressed, an untouched active card passes `check: null` and the dns block renders
without checkmarks. That is the honest reading — nothing has been resolved this session — and the
`Checked …` line already dates the stored half.

**Out of scope: COD-439** (issued certificate details — type, expiry, CA). Nothing here blocks
it: it wants a _new_ section on an active card, and this change gives that card a body to sit in.

## Steps

Stop after each for acknowledgement.

### 1. Stop trusting stored prose on an issued certificate

- `libs/app-cms/feature/domains/src/lib/certificate-issues.ts`: widen the first parameter to
  `{ isConfigured?: boolean | null; validationErrors?: Array<string> | null }` and return only the
  humanized `check.errors` when `isConfigured` is true. Extend the docblock with the reason —
  `validationErrors` is a log of attempts that have since succeeded, and the timestamps are gone
  by the time it reaches here.
- `certificate-issues.spec.ts`: add two cases — an issued certificate whose stored prose is
  ignored in favour of the live codes, and an issued certificate with no live check returning `[]`.
  The existing four cases stand unchanged (they all pass an unissued certificate).

### 2. `DnsRecord` gains a settled voice

- `libs/app-cms/ui/domains/src/lib/dns-record.tsx`: add `settled?: boolean` and
  `labels.settledLede`. When `settled`, render `settledLede` once at the top of the box and skip
  `trafficLede`, `validationLede`, `instructionsLede` and `nameHint`; keep the record rows, the
  checkmarks, the apex note and the ownership section (its lede is already conditional prose, not
  an instruction). Everything else renders byte-identically to today.

### 3. `DomainCard` shows both blocks once requested

- `libs/app-cms/ui/domains/src/lib/domain-card.tsx`: drop `!active` from both guards; derive
  `const settled = active && !check?.issues?.length`.
- Issues box: when `active`, swap the destructive border/background/text for
  `border-border bg-muted/40`, the icon and heading to `text-muted-foreground`, and use
  `labels.issuesActiveHeading`. Keep the destructive treatment for every other status.
- Pass `settled` and `settledLede` down to `DnsRecord`. Replace the "An active certificate is
  answering on every record already" comment above the block with one naming the new rule.
- Add `issuesActiveHeading` and `dnsSettledLede` to `DomainCardProps['labels']`.

### 4. Translations + panel wiring

- `libs/app-cms/util/i18n/src/lib/custom-translations.ts`: add `dnsSettledLede` (between
  `dnsOwnershipLede` and `dnsTrafficLede`) and `issuesActiveHeading` (before `issuesHeading`) to
  the zod schema and to both the `en` and `sv` blocks — the file is alphabetical, keep it that
  way. Proposed copy:
  - `dnsSettledLede` — en: "These are the records the domain runs on. They stay needed — remove
    one and the domain stops answering, certificate or not:" · sv: "De här posterna är vad
    domänen vilar på. De behövs fortsatt — tas någon bort slutar domänen svara, certifikat eller
    inte:"
  - `issuesActiveHeading` — en: "The certificate is issued, and Fly's last check still had this
    to say about the domain:" · sv: "Certifikatet är utfärdat, men Flys senaste kontroll hade
    ändå det här att säga om domänen:"
- `apps/cms/src/components/admin/domains/DomainsPanel.client.tsx`: add the two lookups to the
  `labels` memo. Nothing else changes — `describeCertificateIssues(certificate, row.check)`
  already receives the whole certificate, so step 1's new field arrives for free.

### 5. Stories, checks, commit

- `domain-card.stories.tsx`:
  - `Lifecycle`'s third card already passes `status="active"` + `dns={dns}`, so it becomes the
    settled block with no further edit — and the `PayloadAdmin*` / `Shadcn*` a11y wrappers pick it
    up automatically.
  - Add to `CheckedWithIssues` a fourth card: `status="active"` with
    `check={{ issues: [...], confirmed: { traffic: true, validation: false } }}` — the green-but-
    objected-to case, showing the neutral box above a setup-voice block. The existing
    `IssuesAdmin*` a11y wrappers then cover the new treatment without new stories.
  - Add one settled-with-checkmarks card (active, `confirmed: { traffic: true, validation: true }`)
    — either in `Lifecycle` or alongside the above; that pair is what a reviewer compares.
  - `NeedsAttention`'s active card passes no `dns`, which now exercises the graceful-degradation
    path. Leave it.
- `pnpm nx format:write`, then `nx affected -t lint typecheck` (the `labels` object is exhaustive,
  so a missing key fails the type-check), the `app-cms-feature-domains` tests and
  `nx test cms -- --testPathIgnorePatterns '/.next/'`.
- `nx run cms:build`.
- Commit onto the COD-440 branch; the PR now covers three tickets.

## What to verify

- `nx affected -t lint typecheck` — catches every missing label on `DomainCardProps` and
  `DnsRecordProps`.
- `app-cms-feature-domains` tests — the two new `describeCertificateIssues` cases are the whole
  behavioural change in the feature lib.
- **Storybook:** `App CMS/Domains/DomainCard` in the `payload-admin` light _and_ dark themes.
  Three states have to be told apart at a glance: pending (imperative copy, red issues box),
  active-with-issues (imperative copy, neutral issues box), active-and-clean (settled copy, no
  box). If the neutral box reads as an error, or the settled block reads as a to-do list, the
  voice change has not landed.
- **Manual, in the admin, the ticket's own case:** an active domain (`demo.codeware.se`) must show
  the dns block on page load — with no checkmarks — and after _Check now_ the same block with
  green checkmarks on whatever Fly resolved. Nothing red.
- **Manual, the assumption behind the biggest decision:** on that same active domain, look at the
  `check`/`certificate` payload the endpoint returns. Confirm whether `validationErrors` is
  non-empty on an issued certificate (which is what step 1 guards against) and whether the
  `dnsValidation*` fields survive issuance (which decides whether the settled block shows one
  record or two). Both are inference from Fly's schema right now; this is the cheap way to
  settle them.
- **Manual, no regression on the pending path:** a domain with a pending certificate must look
  exactly as it does today — same red box, same imperative ledes, same `dnsNameHint` footnote.
  That path is meant to be byte-identical.
- Nothing here touches the database or boot, so `nx test-migrate cms` is not implicated.
  `nx verify cms` is the user's to run if the admin looks off.

## Out of scope

- [COD-439](https://linear.app/codeware/issue/COD-439) — issued certificate details (type, expiry,
  CA). This change gives it the body to render into; it does not render it.
- [COD-437](https://linear.app/codeware/issue/COD-437) — multi-resolver dns diagnostics. Unblocked
  by this, not implemented here.
- COD-440's merge gate still governs the branch: do not merge until row 4 of its cutover table is
  confirmed complete.
