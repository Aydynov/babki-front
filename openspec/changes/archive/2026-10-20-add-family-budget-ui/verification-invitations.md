# Invitations and authentication verification

Verified on 2026-10-18.

## Implemented

- Owner invitation creation, local-only secret result and clipboard success/failure feedback, paginated metadata list,
  and confirmed revocation with conflict refresh.
- Public `/join` route, fragment extraction and immediate URL cleanup, tab-local pending storage with an absolute
  30-minute lifetime, preview expiry shortening, memory fallback and explicit cancellation.
- Confirmed-session preview and explicit acceptance; terminal 400/409 cleanup, 409 navigation to groups without
  guessed group ID, shared preview/accept Retry-After pause and explicit retry after ambiguous network errors.
- Acceptance refreshes membership/group and opens the returned group budget without treating refetch failures as
  retryable acceptance failures. Secret-bearing operations bypass TanStack Query and mutation caches.
- Safe redirects survive login/register links and existing TOTP/recovery flow. Registration honors a safe destination.
  Explicit logout removes the pending invitation. Session expiry and successful auth preserve its original lifetime.
- Session endings and identity-change auth emit `babki:session-cleared` for active budget cleanup.

## Automated checks

The following explicit command passed **16 tests**:

```sh
node --experimental-strip-types --test \
  src/shared/lib/pending-invitation/pending-invitation.test.mjs \
  src/features/group-invitations/model/invitation-errors.test.mjs \
  src/features/auth/model/redirect.test.mjs \
  src/features/auth/model/end-session.test.mjs \
  src/features/auth/model/login-flow.test.mjs \
  src/features/auth/model/session-response.test.mjs
```

Coverage: absolute TTL and its boundary, reload, memory fallback, invalid replacement, preview expiry shortening,
fragment cleanup, unsafe/secret-bearing redirect rejection, session cleanup, TOTP/recovery return destination,
identity transition cache cleanup, and Retry-After seconds/date/fallback.

The pending-storage and additional redirect checks were first run against missing/original implementation and failed,
then passed after implementation. This is targeted `node:test` evidence, not a claim of a working repository-wide test runner.

Scoped ESLint passed:

```sh
npx eslint src/features/group-invitations src/features/auth src/pages/join src/pages/register \
  src/app/routes/login.tsx src/app/routes/register.tsx src/app/routes/join.tsx \
  src/shared/lib/pending-invitation
```

`npm run lint`, `npm run lint:architecture`, and `npm run build` were also run during concurrent implementation.
They failed on in-progress financial/budget integration outside this ownership. No invitation/auth path was reported by
TypeScript or Steiger; the one pending-storage long-line lint finding was repaired and scoped lint rerun successfully.
Final repository-wide results belong to the integration verification.

## Browser checks and limits

Started `npm run dev -- --host 127.0.0.1 --port 5175` and used Chrome against that origin. The initial sandbox TCP bind
failed with EPERM; the approved escalated run succeeded. Stopped the server after checks.

Manually observed:

- `/join` without a pending token displays the instruction to open the original invitation, with no empty-token API action.
- A synthetic valid-format invitation in an already authenticated browser produced the generic terminal invalid-invitation
  message, and the visible URL was cleaned to `/join`.
- No acceptance was submitted, no real invitation was created/revoked, and the existing user session was preserved.

Owner create/copy/revoke, unauthenticated registration/TOTP completion, success/409/429/network ambiguity, storage-blocked
browser behavior, and 320px responsiveness were not manually exercised in this check. Unit checks and schema validation do
not substitute for those browser scenarios. Complete them against controlled disposable accounts or an API simulation.

## Follow-up: physical expiry while authenticating

A final review found that an expired secret was previously removed only when read, allowing it to remain in
sessionStorage while the user stayed on an authentication screen. The pending store now owns one expiry timer,
independent of mounted routes. Repeated reads do not create more timers; replacing or shortening an invitation
cancels its old deadline. App bootstrap restores pending storage and schedules its original remaining lifetime on
login, registration and other routes, including after reload. Storage failures still permit memory-only expiry.

Two fake Date/setTimeout regressions first failed against the previous implementation, then passed. They verify
physical removal without `/join` polling, restoration of the remaining deadline after reload, one timer across repeated
reads, safe replacement, expiry shortening, and memory fallback expiry. The explicit invitation/auth command above now
passes **18 tests**. Adding `src/features/manage-income/model/income-edit.test.mjs` runs **21 tests**, all passing.

Focused ESLint and `npx tsc -b` passed. `npm run lint:architecture` and `npm run build` passed after this follow-up;
Vite continues to report its bundle-size advisory. `npm run lint` also passed after repair of a test formatting issue.
