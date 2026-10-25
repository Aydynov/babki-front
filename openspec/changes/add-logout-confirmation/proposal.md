# Proposal

## Why

The logout button currently ends the session immediately, so an accidental click interrupts work. Require confirmation using the project's existing dialog styling before clearing the session.

## What Changes

- Open a confirmation dialog when the shared logout button is activated.
- Offer localized Russian title, description, cancel and confirm actions.
- Preserve the session when the user cancels, presses Escape or clicks the backdrop.
- Run the existing logout cleanup and login navigation only after explicit confirmation.
- Support keyboard focus management and narrow screens using existing shared UI primitives.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `user-authentication`: change user-initiated logout from immediate session termination to confirmation followed by existing cleanup.

## Impact

- `src/features/auth/ui/logout-button.tsx`: shared confirmation behavior for existing usages in `MainPage` and `BudgetMainPage`.
- `src/shared/lib/i18n/ru/main.json`: confirmation copy while retaining the existing `auth.logout` string.
- Reuse `shared/ui/alert-dialog` and `shared/ui/button`; no new dependency or API changes.
- Preserve session-expiration handling, route protection, cleanup semantics and local development token behavior.
