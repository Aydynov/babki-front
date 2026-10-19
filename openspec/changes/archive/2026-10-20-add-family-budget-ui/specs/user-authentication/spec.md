## MODIFIED Requirements

### Requirement: Successful registration
The system SHALL create and establish the new session from a schema-valid registration response and restore
a validated internal destination when supplied, using `/main` otherwise.

#### Scenario: User registers successfully
- **WHEN** a user submits valid first name, last name, email, password, and currency values and `/auth/register` returns a valid authentication response without a valid internal destination
- **THEN** the system persists the token, caches the returned user, and navigates to `/main`

#### Scenario: Optional profile values are omitted
- **WHEN** the registration form submits its payload
- **THEN** the system omits birth date and notes from the registration request

#### Scenario: Registration restores an invitation destination
- **WHEN** registration succeeds with a valid internal redirect to `/join`
- **THEN** the system establishes the session and navigates to `/join` without accepting the pending invitation

#### Scenario: Registration rejects an external destination
- **WHEN** registration includes an external, protocol-relative, malformed or otherwise unsafe destination
- **THEN** the system ignores it and navigates to `/main`

### Requirement: User logout
The system SHALL expose a logout action in the authenticated main-page header and SHALL remove the active
session, all query data, active budget state and pending invitation secrets when activated. Only a per-user
last-budget identifier preference SHALL remain for restoration after the same identity is confirmed again.

#### Scenario: User logs out
- **WHEN** an authenticated user activates logout
- **THEN** the system clears the stored access token, entire query cache, active budget and pending invitation and replaces the current route with `/login`

#### Scenario: Browser history after logout
- **WHEN** a logged-out user navigates backward to a previously protected location
- **THEN** the protected route guard redirects the user to login instead of rendering cached private data

#### Scenario: Preference is isolated from session data
- **WHEN** the same user signs in again without an explicit budget destination
- **THEN** the last-budget identifier can be resolved after confirming identity and membership, without restoring cached balances, names, permissions or secrets

## ADDED Requirements

### Requirement: Safe destination across authentication pages
The system SHALL preserve a validated internal destination when switching between login and registration,
without placing invitation secrets in redirect or query values. Existing password, TOTP and recovery flows
SHALL retain the destination until authentication completes.

#### Scenario: Login to registration and back
- **WHEN** a user following an invitation switches between login and registration
- **THEN** both pages preserve only the safe `/join` return destination and the pending invitation remains separate

#### Scenario: Unsafe redirect input
- **WHEN** an authentication page receives an unsafe return destination
- **THEN** it is discarded before navigation or propagation to another authentication page

### Requirement: Identity transition clears active budget data
The system SHALL discard active budget state and financial query data on a change of authenticated identity
and SHALL resolve preferences only for the newly confirmed user. Expected login or registration completion
SHALL preserve a still-valid pending invitation in that tab until acceptance or cancellation.

#### Scenario: Different user authenticates
- **WHEN** login or registration establishes a different identity
- **THEN** no active selection, financial data or permissions from the previous identity are reused

#### Scenario: Expired session while joining
- **WHEN** the active session expires while a valid invitation is pending
- **THEN** session data is cleared, the safe return destination is preserved and the invitation can resume within its original tab-local lifetime
