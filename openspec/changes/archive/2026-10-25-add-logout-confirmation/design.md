# Design

## Context

See `proposal.md` for motivation. `LogoutButton` currently clears the pending invitation and invokes `endSession` directly from its click handler. `endSession` clears the token and query cache, emits the session-cleared event used by active budget state, and replaces the route with `/login` through its supplied callback. The button is reused in `MainPage` and the space-selection branch of `BudgetMainPage`, and is hidden in local-token mode.

The shared `AlertDialog` already supplies the portal, blurred backdrop, rounded card, typography, spacing and responsive padding. Expense deletion demonstrates its controlled open state, explicit backdrop dismissal and focus restoration. A short design is included to resolve focus and cancellation choices before changing this session boundary.

## Goals / Non-Goals

**Goals:**
- Keep confirmation local to the auth feature and ensure every existing button usage behaves consistently.
- Keep all session-changing effects behind the explicit confirm action.
- Use existing shared UI and i18next conventions.

**Non-Goals:**
- Add a logout endpoint, server revocation, asynchronous logout states or dependencies.
- Change session-expiration handling, authentication guards, financial caching or local-token behavior.
- Introduce a global confirmation service or modify unrelated dialogs.

## Decisions

### Keep the dialog and its state in LogoutButton

Add a component-local open flag and button/cancel refs. The existing outline logout button only opens the dialog. Confirmation executes the current pending-invitation cleanup and `endSession` call unchanged. Dismissal only closes the dialog. Keep hooks unconditional before the existing local-token early return.

This avoids duplicating logic in pages. A separate reusable confirmation abstraction adds indirection for a single small dialog; retain inline composition unless readability requires a private auth-local component.

### Compose the existing AlertDialog

Use its header, title, body, description and footer with `max-w-sm`, matching the expense confirmation pattern. Use the existing outline cancel and destructive confirm button variants. Native `window.confirm` would not match project styling or allow the required localized presentation and focus control.

Set initial focus explicitly to cancel and final focus to the logout trigger via the popup's supported focus props. Use controlled dismissal for Escape and an explicit backdrop handler, as the shared backdrop does not provide one by default. No additional close icon is needed.

### Add confirmation strings without replacing auth.logout

Keep the existing `auth.logout` string for the trigger and add a dedicated `auth.logoutConfirmation` group for title, description, cancel and confirm. Use the Russian copy specified in the delta. This avoids converting a string key already consumed by existing UI into an object.

### Preserve automatic session termination

Only the user-facing button gains confirmation. Do not place it inside `endSession` or the shared API layer: expired-session handling must still terminate invalid sessions immediately. Logout is synchronous client cleanup, so no artificial loading or error state is introduced.

## Risks / Trade-offs

- Focus could land on confirm or fail to return to the trigger → use explicit focus refs and manually verify keyboard open, Tab, Shift+Tab and every dismissal path.
- Moving the handler could clear data on opening or cancellation → keep cleanup solely in confirm and verify retained budget and invitation state on dismissal.
- Local-token development hides the affected control → verify with ordinary authentication, without exposing credentials in screenshots or logs.
- The repository has no configured general test runner → use required lint/build checks and browser verification; do not introduce a test framework for this dialog or claim automated UI coverage.

## Migration Plan

Ship the component and localization changes together in the normal frontend build. No data migration or backend rollout is required. Reverting those changes restores immediate logout without altering stored-data formats.
