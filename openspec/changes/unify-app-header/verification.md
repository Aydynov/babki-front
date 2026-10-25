# Verification

## Follow-up: budget action beside breadcrumbs

- Moved «Открыть бюджет» from the global panel into the settings page's breadcrumb row. SpacesLayout accepts an optional action; directory/create keep their existing navigation.
- At 320, 768 and 1200 px, measured equal vertical centers for breadcrumbs/action, one budget button, no global-header duplicate, no document overflow, and the correct explicit space destination. Mobile uses an accessible icon-only back action and truncates the directory crumb to keep one row.
- Verified the button stays absent during loading and after a space error; successful activation opens the selected budget. Lint, architecture and build pass. Screenshots: `settings-breadcrumb-action-320.png`, `settings-breadcrumb-action-768.png`, `settings-breadcrumb-action-1200.png`.

## Follow-up: remove the dashboard invitation panel

- Removed the dashboard's invite callout, toggle and embedded SpaceInvitations. The owner-only menu entry still opens invitation management in settings.
- Kept only the first-account setup for an owner with a confirmed empty account list. With an account present, that setup callout is absent as well.
- Browser-checked both account states at 320 and 1200 px with synthetic data: no «Ведите бюджет вместе», no invite toggle or embedded panel; «Пригласить близких» remains in the space menu. Saved `dashboard-no-invitation-panel-empty-320.png`, `dashboard-no-invitation-panel-empty-1200.png`, `dashboard-no-invitation-panel-account-320.png`, and `dashboard-no-invitation-panel-account-1200.png`.
- Lint, architecture and build pass. The header remains within viewport at both widths. The broader synthetic dashboard reports document width 1213 px for a 1200 px viewport, so this follow-up does not claim a green whole-document overflow assertion at desktop width; at 320 px the document width is 320 px.

## Follow-up: invite loved ones from the space menu

- Added owner-only «Пригласить близких» with a user-plus icon for the confirmed current space. It navigates to `/spaces/<spaceId>#space-invitations`, targeting the existing invitation-management card.
- Verified actual route navigation at 320 and 1200 px with synthetic owner data: the correct invitation section is visible after navigation, with no horizontal overflow and no automatic invitation-creation POST. Verified the item is absent for a member. Screenshots: `invite-menu-destination-320.png`, `invite-menu-destination-1200.png`.

## Follow-up: fade-only menu transitions

- Reproduced the close jitter before the fix: the spaces popup jumped approximately 15.8 px when its CSS scale changed to 0.95. The transition targeted transform, while Tailwind's scale uses the separate scale property.
- Removed start/end scale and transform transitions in the common menu primitive. Opening/closing now use only opacity over 150 ms for spaces, account and the nested picker.
- Sampled every animation frame through unmount at 1200 and 320 px. All three popup types had zero position movement, unchanged dimensions, no scaling/transform, and intermediate opacity values during fade-out.
- `npm run lint`, `npm run lint:architecture`, `npm run build`, `git diff --check` and strict OpenSpec validation pass. The existing large-bundle warning remains.

## Follow-up: rounded header and nested space selection

- Removed the repeated visible title from the nested space list. The parent menu item and accessible radio-group label remain. At 320 and 1200 px the submenu starts directly with a space choice and has no horizontal overflow. Lint, architecture and build checks pass after the removal; screenshots: `submenu-no-title-320.png`, `submenu-no-title-1200.png`.

- Added rounded lower corners. Both main dropdowns anchor to the full navigation row, so their top edge stays below the entire header, including the wrapped mobile page action.
- «Выбрать пространство» is now an icon menu item opening a nested menu on the right. Existing radio selection, current-space indicator, pagination and budget navigation remain in that submenu.
- Browser verification at 320, 768 and 1200 px confirms popup placement below the header, desktop submenu to the right, viewport bounds, ArrowRight/ArrowLeft navigation, parent focus restoration, pagination and space selection. Screenshots visually inspected: [desktop submenu](screenshots/submenu-desktop.png), [320 px submenu](screenshots/submenu-320.png), [768 px submenu](screenshots/submenu-768.png), [1200 px submenu](screenshots/submenu-1200.png).
- `npm run lint`, `npm run lint:architecture` and `npm run build` pass after these changes. The pre-existing large-chunk warning remains. Checks use the same synthetic browser environment described below.
- Verified nested-menu loading, confirmed empty list, list error and explicit retry recovery. Keyboard opening avoids conflating hover-open with a subsequent click toggle during asynchronous checks.

Date: 2026-10-25. Implementation and the checks listed below are complete.

## Environment and baseline

- Before implementation: `npm run lint`, `npm run lint:architecture`, `npm run build` passed. Build already warned about chunks over 500 kB.
- Vite started with a synthetic API base and ordinary authentication on `http://127.0.0.1:5174`; no real credentials or private backend were used. A separate headless Chrome profile is controlled with the bundled Playwright runtime.
- The browser exercises the actual application routes, router, query cache, menu primitives and dialogs. HTTP responses are intercepted with synthetic users/spaces. This validates frontend behavior, not backend integration.
- Before implementation, the browser check failed because `/spaces` had zero shared banners and no account action. After implementation it finds one shared header and account trigger.
- The repository has no configured general test runner. Temporary browser scripts are verification tools, not a claimed permanent automated test suite.

## 1.1 Shared menu and composition

- `npm run lint:architecture` passes after placing route composition under `app/layouts` (Steiger forbids `app/ui`). Widgets import features/entities through public APIs; shared menu wraps the installed Base UI.
- On the actual `/spaces` route, Enter opens the spaces menu; ArrowDown focuses a radio item; Escape dismisses and restores focus to the persistent spaces trigger.
- Space/account actions are composed by the common header above page content.

## Observed integration checks

- A 21-space synthetic membership list exposes 20 choices then the final choice through next-page navigation. Selecting space 21 from the directory opens its explicit `/main?spaceId=...` URL and updates the visible header identity.

## 1.2 Space navigation states

- Verified delayed loading with account still present, confirmed `total=0` empty state, failed list with common links still available, and explicit retry recovering the choices.
- Verified pagination to space 21, selection from the directory, and header identity for a context not on the first list page. Context settings, directory, create and invitation links are present.

## 2.1 Account menu

- Actual `/join` account menu shows the synthetic current user's name/email. Opening it performs no 2FA lifecycle calls.
- 2FA and logout open their existing dialogs. Logout cancellation preserves session and route; both dialog types return focus to the account trigger. Escape closes the account menu and permits reopening with Enter.
- A second Vite instance on port 5175 uses a synthetic environment token. Its account menu retains identity and contains no logout/2FA items.

## 1.3 Responsive appearance

- Checked 320, 768 and 1200 px with a long space name: no horizontal document overflow; account remains inside viewport; contextual action wraps below on mobile.
- Inspected actual screenshots after menu transitions: popup is opaque, constrained to viewport and scrolls vertically; long name is fully readable inside it.
- Screenshots: [desktop settings](screenshots/settings-desktop.png), [320 px settings](screenshots/settings-320.png), [768 px settings](screenshots/settings-768.png), [1200 px settings](screenshots/settings-1200.png), [320 px spaces menu](screenshots/spaces-menu-320.png), [desktop account](screenshots/account-desktop.png).

## 3.1 Route-derived context

- Opening settings for a different space shows that route's name and its budget action without changing the last-budget preference. Creation and join show neutral «Пространства».
- `/main` restores the per-user preference into an explicit URL; direct URL overrides it. Repeated and invalid spaceId show the unselected state rather than querying finances for invalid identifiers.
- Header/account persist during space metadata loading and a 503 error. Confirmed 403/404 recovers to selection with the session preserved.

## 2.2 Dialog lifecycle and focus

- Keyboard-opened account action opens 2FA; status failure exposes retry, which recovers to the disabled view. Completed synthetic setup/confirmation through the real forms.
- Escape during a delayed confirmation response keeps the dialog mounted. Returned ten synthetic recovery codes remain displayed; Escape and close are blocked before acknowledgement. After saving acknowledgement and returning to status, Escape closes and restores account-trigger focus.
- Identity-preserving token replacement leaves the invitation intact. No screenshots of provisioning values or recovery codes were saved.
- Confirmed logout clears session and pending invitation; the header disappears on login. Browser Back through actual SPA history to a protected directory is guarded and redirects to login. Cancellation preserves session, route and invitation and returns focus.
- Existing *.test.mjs files were not modified; no general node test command is claimed.

## 4.1–4.2 Invitation integration

- Guest `/join` keeps AuthShell; following its login link and completing a synthetic ordinary login returns to `/join` with exactly one shared panel and the pending invitation preview.
- Authenticated join without a pending invitation retains the instruction to open an invitation link. Invalid invitation displays its error with account navigation available and no accept action.
- Opening account/2FA, completing token rotation and cancelling logout preserve the active invitation. No acceptance request occurs until the explicit «Вступить» button; that action sends one request and opens the returned budget.
- Confirmed logout clears the pending invitation. Guest login/register and private-route redirects were also checked at desktop/mobile widths.

## Child route errors

- Regression check before adding the authenticated route error component: aborting the spaces-page module request replaced the entire page and left zero account triggers.
- After the fix, the authenticated error view shows the common header and retry UI; restoring the module request and reloading recovers the page. The error boundary displays the panel only for an already cached confirmed user with an active token.

## 3.2 Shared page layout and failure boundaries

- Final matrix covered `/main`, `/spaces`, `/spaces/new`, `/spaces/<spaceId>` and authenticated `/join` at 320 and 1200 px: exactly one banner, account keyboard access, no duplicate directory primary action and no horizontal overflow.
- A deliberately held spaces-page module request confirms the header remains available after the route's pending interval. Releasing it renders the directory normally.
- Independent code review identified the same error-boundary gap on authenticated `/join`. A regression check reproduced zero account triggers when its content module failed. Both routes now share NavigationError; both error/recovery checks pass. No session check is inferred from an unconfirmed token alone.
- Page headings, forms, local back links, period controls and dashboard onboarding remain in page content; redundant global controls were removed.

## 3.3 Safe financial transitions

- Used the actual create-account form and router blocker. Filling its name and activating a header space choice produces the existing unsaved-data confirmation; cancelling preserves the route and value. Confirming switches the explicit space URL and unmounts the old form.
- Header Link/menu activation was dispatched through the DOM while the existing modal owned pointer focus; this checks the shared navigation/blocker path, not a claim that the underlying header is pointer-interactive through a modal.
- While a synthetic account POST is delayed, space choices expose disabled state; the account trigger itself remains enabled. Switching becomes available when the mutation completes.
- Selected-period storage remains unchanged. Actual SPA Back/Forward restores the corresponding space URLs after the accepted transition. 403/404 access recovery and 503 retryable errors were checked separately above.

## 5. Final checks and scope of evidence

- `npm run lint`: passed.
- `npm run lint:architecture`: passed, no problems found.
- `npm run build`: passed. The existing warning about chunks larger than 500 kB remains.
- `git diff --check`: passed.
- `openspec validate unify-app-header --strict`: passed.
- `src/routeTree.gen.ts` was not manually edited and has no tracked diff. No dependencies were added.
- Browser assertions and visual inspection exercised real application code against synthetic intercepted responses. This is frontend integration evidence; a live authenticated backend was not used. No persistent general/UI test runner was introduced and no full automated-suite coverage is claimed.
- Additional screenshots: [main empty selection, 320 px](screenshots/main-320.png), [main selection, desktop](screenshots/main-1200.png), [empty spaces menu](screenshots/spaces-empty-menu.png). All captured identities/data are synthetic; no provisioning/recovery/token values were captured.
- Independent review completed; its one actionable finding (join error-boundary coverage) was fixed and verified. No deferred implementation items remain in this change.
