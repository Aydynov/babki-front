# Verification

Date: 2026-10-25.

## Static checks

- `npm run lint`: passed after correcting JSX prop formatting.
- `npm run lint:architecture`: passed, no problems found.
- `npm run build`: passed. Vite reports chunks larger than 500 kB; this change does not address bundle splitting.
- `git diff --check`: passed.

## Browser checks

Started Vite with `FRONT_USE_LOCAL_AUTH_TOKEN=false npm run dev -- --host 127.0.0.1 --port 5173`.
The clean browser session opens the real application at `/login`; no ordinary authenticated test session was available there.

Used a temporary local HTML harness rendering the actual `LogoutButton`, actual shared UI, application styles and i18next, with a real QueryClient and a memory router. Only synthetic token, invitation and query values were seeded; no backend calls or real credentials were used. Removed the harness after verification and cleared its synthetic session through confirmed logout.

Observed before implementation: clicking logout immediately cleared token, cache and invitation, navigated to `/login`, and displayed no dialog.

Observed after implementation:

- Exact Russian title, description and both actions render; accessible title/description references resolve.
- Opening preserves the synthetic token, query data, invitation and `/main` memory route; no session-cleared event fires.
- Cancel and backdrop dismissal close the dialog, preserve those values and return focus to the trigger. Reopening works repeatedly.
- Native keyboard checks: initial focus is cancel; Tab moves to confirm, next Tab wraps to cancel, Shift+Tab wraps back to confirm; Escape closes the dialog and returns focus to the trigger.
- Confirm clears token, query data and invitation, emits one session-cleared event and navigates the memory router to `/login`.
- At 375 × 812, the dialog is 343 px wide with 16 px side margins; no horizontal document overflow. Both actions remain visible.
- Toggling the local-token environment flag in the isolated harness and remounting hides the button in local mode and shows it in ordinary mode.

Screenshots show the isolated component, not an authenticated dashboard:

- [Desktop, 1280 × 720](screenshots/desktop.png)
- [Mobile, 375 × 812](screenshots/mobile.png)

## Pending authenticated integration (task 2.1)

Not verified end to end: both real page entry points under ordinary authentication; browser Back after actual-route logout; active budget clearing and per-user preference restoration; actual expired-session handling; page loading/empty/error states with an authenticated backend. The harness verifies the component and its cleanup dependencies but does not replace these route checks. The existing real application was confirmed to redirect an unauthenticated visit to `/login`.

Task 2.1 remains unchecked until an ordinary authenticated test session and suitable data are available. Session termination, route guards and their underlying modules were not modified. No configured general test runner exists, no `npm test` or bare `node --test` run is claimed, and no persistent automated UI coverage was added.
