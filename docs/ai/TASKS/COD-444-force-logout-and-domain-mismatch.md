# COD-444 — Make a rejected admin session recoverable without deleting cookies

Branch `cod-444-make-a-rejected-admin-session-recoverable-without-deleting`.
Follow-up to the [COD-440](https://linear.app/codeware/issue/COD-440) incident on
2026-08-19.

## The incident, mechanically

`CUSTOM_URL` was retired from `EnvSchema` and deployed before its cutover (COD-440 row
4), so `APP_MODE.serverURL` fell to `FLY_URL` while the app was still being reached on
`cms.codeware.se`. The chain from there:

1. `sanitizeConfig` pushes `config.serverURL` onto `config.csrf`
   (`payload/dist/config/sanitize.js`), so csrf held **only** `https://cdwr-cms.fly.dev`.
2. `adoptPlatformDomains` found no `platform-settings` row, returned early, and never
   appended `https://cms.codeware.se` to csrf or took over `serverURL`.
3. `extractJWT` drops the session cookie when the request `Origin` is not in a non-empty
   `config.csrf` — so every authenticated request from the custom domain 401'd.

Three symptoms, one cause: Platform Settings disappeared (`admin.hidden` sees a null
`req.user`), the sidebar showed "Editor" (a two-way fallback, not a real role), and
logout was impossible.

## Why logout was impossible

`useAuth().logOut` in `@payloadcms/ui`:

```js
if (user && user.collection) { ...post logout... }   // skipped entirely when user is null
catch (_) {}                                          // and swallows failures otherwise
return true;
```

In the stuck state `user` is null, so the button issued **no request at all** and the
cookie was never touched. Recovery meant deleting it by hand in devtools.

## Changes

| #   | What                                                                    | Where                                |
| --- | ----------------------------------------------------------------------- | ------------------------------------ |
| 1   | `/admin/force-logout` clears the session cookies and redirects to login | `proxy.ts`, `utils/force-logout.ts`  |
| 2   | Logout button always leaves through that route                          | `AdminNav.client.tsx`                |
| 3   | Mismatch warning on the login screen and in the nav                     | `DomainMismatchNotice{,.client}.tsx` |
| 4   | Adoption warns instead of returning silently                            | `adopt-{platform,tenant}-domains.ts` |
| 5   | Fly url kept in csrf explicitly                                         | `adopt-{platform,tenant}-domains.ts` |

The middleware is the right home for 1: it runs before Payload's auth, so it cannot 401
the way Payload's own logout does, and it is reachable by url alone — something support
can hand to a locked-out user.

Detection for 3 has to be server-side. Adoption assigns `config.serverURL` in `onInit`,
after the client config has been derived, so the browser still receives the boot-time
value — the admin HTML served from `cms.codeware.se` advertises
`"serverURL":"https://cdwr-cms.fly.dev"` even with adoption logged as successful and
`cache-control: no-store`. A client-side `serverURL !== origin` check would fire on a
perfectly healthy deployment.

## On step 5

Already true by accident before this change: `sanitizeConfig` seeds csrf with the
boot-time `serverURL`, which is `FLY_URL`, and adoption appends rather than replaces. So
the `.fly.dev` support path was never actually lost. Made explicit anyway — the
guarantee rested on a Payload internal, and it is one term in a set union. Pinned by a
new case in `adopt-tenant-domains.spec.ts`, alongside the existing assertions.

## Checks

- `nx run-many -t lint test -p cms app-cms-util-i18n` — green, 13 tests
- `nx payload cms generate:importmap` — run and committed; two new entries, nothing lost
- `nx build cms` — the app has no `typecheck` target, so the build is the type gate

## Not done

- `DISABLE_DOMAIN_ADOPTION` unchanged — accepted as a support task.
- The stale client `serverURL` leaves `og:image` and absolute links pointing at the Fly
  url. Out of scope here; worth its own ticket.
