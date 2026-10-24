# Space migration verification

This local-only simulation uses synthetic data and the maintained contract in
`../babki-back/postman/specs/babki.openapi.json`. It does not contact the backend or
prove backend accounting, persistence, concurrency or authorization enforcement.
The sibling checkout is required by the HTTP contract check.

Start the installed Postman CLI:

```sh
postman simulation run postman/simulations/space-finance.sim.yaml --port 4917
```

In another terminal:

```sh
node --test postman/simulations/space-finance-client.test.mjs
```

This runs the real frontend API clients through Axios and localhost HTTP. It checks
request methods, paths, query/body field names against the backend OpenAPI, plus
response parsing, typed detail/delete dispatch, lifecycle envelopes, 204 and
representative rejected responses. The scenario resets its disposable state.

For UI verification, start Vite with synthetic configuration:

```sh
FRONT_BASE_API_URL=http://127.0.0.1:4917/api/api/v1 FRONT_USE_LOCAL_AUTH_TOKEN=false FRONT_LOCAL_AUTH_TOKEN= npm run dev -- --host 127.0.0.1 --port 5179 --strictPort
```

The mock accepts synthetic registration/login data. Its local test control
endpoints under the same base URL are POST `/__test/reset`, POST `/__test/config`
and GET `/__test/state`. Configurable flags include `failure` with `match`, `status`
and `message`, `invitationError`, `spaceRole`, `spacePermissions` and `spaceDenied`.
These controls are fixture-only and are never part of frontend production code.

Postman workspace discovery was unavailable because the installed CLI failed to
read its macOS keychain session. No workspace was rebound or published. This
fixture is maintained locally alongside the migration evidence.

Expense-entry edge cases and responsive browser checks: [expense-entry.md](expense-entry.md).

The local fixture also supports monthly expense-limit list/detail/create/update/delete,
filters by period/currency/category, and derives the remainder from synthetic expenses.
Limit-widget UI evidence and focused cache/model commands:
[verification.md](../../openspec/changes/archive/2026-10-24-improve-expense-limits-widget/verification.md).
