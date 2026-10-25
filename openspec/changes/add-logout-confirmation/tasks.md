# Tasks

## 1. Confirmation UI and localization

- [x] 1.1 Add `auth.logoutConfirmation` Russian title, description, cancel and confirm strings, retaining `auth.logout`; verify the rendered dialog matches the delta's exact copy and no translation keys are displayed.
- [x] 1.2 Compose a controlled shared `AlertDialog` inside `LogoutButton` with outline cancel, destructive confirm, cancel initial focus, trigger final focus and backdrop dismissal; run `npm run dev` and verify opening, all dismissal paths, keyboard focus containment and a narrow viewport without overflow.
- [x] 1.3 Move the existing invitation cleanup and `endSession` call behind confirm only, retaining the local-token guard; verify opening/cancelling leaves the session and route intact, while confirmation clears private state and replaces the route with `/login`.

## 2. Integration verification

- [ ] 2.1 Verify every existing logout entry point under ordinary authentication, including the space-selection page, and record results: repeated open/cancel, confirmed logout, browser Back protection, preserved last-budget preference, cleared pending invitation, and automatic expired-session handling without confirmation. Verify local-token mode still hides logout. Where relevant, check the affected route with loading, empty and error data states; keep secrets out of captured evidence.
- [x] 2.2 Run `npm run lint`, `npm run lint:architecture` and `npm run build`; record results and browser verification evidence in a change-local `verification.md`, including desktop/mobile screenshots of the dialog without sensitive information. Explicitly report that no configured general test runner or automated UI coverage exists, and document any blocked checks rather than marking them passed.
