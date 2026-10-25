# Spec Delta

## MODIFIED Requirements

### Requirement: User logout
The system SHALL expose a logout action in authenticated navigation and require explicit confirmation before removing the active session, all query data, active budget state and pending invitation secrets. Opening or dismissing confirmation SHALL preserve this data. After confirmed logout, only a per-user last-budget identifier preference SHALL remain for restoration after the same identity is confirmed again.

#### Scenario: User opens logout confirmation
- **WHEN** an authenticated user activates logout from any existing logout entry point
- **THEN** the system displays a confirmation dialog and preserves the current session, query data, active budget, pending invitation and route

#### Scenario: User logs out
- **WHEN** an authenticated user confirms logout in the dialog
- **THEN** the system clears the stored access token, entire query cache, active budget and pending invitation and replaces the current route with `/login`

#### Scenario: User cancels logout
- **WHEN** the user activates cancel, presses Escape or clicks the backdrop of the logout confirmation
- **THEN** the system closes the dialog without ending the session or changing query data, active budget, pending invitation or route, and returns focus to the logout button

#### Scenario: Browser history after logout
- **WHEN** a logged-out user navigates backward to a previously protected location
- **THEN** the protected route guard redirects the user to login instead of rendering cached private data

#### Scenario: Preference is isolated from session data
- **WHEN** the same user signs in again without an explicit budget destination
- **THEN** the last-budget identifier can be resolved after confirming identity and membership, without restoring cached balances, names, permissions or secrets

## ADDED Requirements

### Requirement: Logout confirmation presentation and accessibility
The logout confirmation SHALL use the application's existing confirmation-dialog visual style and localized Russian copy. It SHALL expose an accessible title and description, trap keyboard focus while open, initially focus cancel, and fit narrow screens without horizontal overflow.

#### Scenario: Confirmation content
- **WHEN** the logout confirmation opens
- **THEN** it shows the title `Выйти из аккаунта?`, description `Чтобы продолжить работу, потребуется войти снова.`, and actions `Отмена` and `Выйти`

#### Scenario: Keyboard operation
- **WHEN** a keyboard user opens the logout confirmation
- **THEN** focus starts on `Отмена`, remains inside the dialog during Tab and Shift+Tab navigation, and logout occurs only when `Выйти` is explicitly activated

#### Scenario: Narrow viewport
- **WHEN** the confirmation is displayed on a narrow viewport
- **THEN** its title, description and both actions remain readable and operable without horizontal overflow
