# Expense entry browser verification

Local synthetic scenarios for `refine-expense-entry-behavior`. Requires installed Postman CLI and project dependencies.
No real backend is contacted. The simulation does not prove server authorization, persistence or accounting.

Start the simulation:

```sh
postman simulation run postman/simulations/space-finance.sim.yaml --port 4918 --output ndjson
```

Start the frontend in another terminal (the token below is a disposable fixture value):

```sh
FRONT_BASE_API_URL=http://127.0.0.1:4918/api/api/v1 FRONT_USE_LOCAL_AUTH_TOKEN=true FRONT_LOCAL_AUTH_TOKEN=synthetic-space-fixture npm run dev -- --host 127.0.0.1 --port 5181 --strictPort
```

Seed one scenario before opening/reloading the browser; this replaces only in-memory fixture state:

```sh
curl -sS http://127.0.0.1:4918/api/api/v1/__test/expense-entry \
  -H 'Content-Type: application/json' -d '{"scenario":"narrow"}'
```

Open `http://127.0.0.1:5181/main?spaceId=000000000000000000000010`.
Reload after changing a scenario to clear previously loaded frontend state.

| Scenario | Browser check |
| --- | --- |
| `saving` | Create expense: no default account; manually choose the only saving account. |
| `empty` | Create expense: no active accounts, submission unavailable. |
| `historical` | Edit expense: preserve former participant when saving another field; explicitly reassign to self. |
| `other` | Edit expense: current other member is selected and can be reassigned. |
| `restricted` | Edit another author's expense as ordinary participant: no reassignment control; change merchant. |
| `archived` | Save unchanged archived category; then replace with active. Archived option never appears in menu. |
| `narrow` | At 320×640 and 390×844, add fifth item; check name autofocus, full focus ring, Tab to quantity and close button. |

Inspect GET `/api/api/v1/__test/state` on the same origin for recorded PATCH bodies and resulting fixture records.
Unchanged participants must omit `participantId`; explicit self selection sends `000000000000000000000001`.
Archived category ID is `000000000000000000000031`, active category ID is `000000000000000000000030`.
Stop both local processes with Ctrl+C. Fixtures and control routes are local test infrastructure only.
