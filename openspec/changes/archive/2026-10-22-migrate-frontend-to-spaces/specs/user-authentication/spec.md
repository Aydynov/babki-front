## MODIFIED Requirements

### Requirement: Public registration page
The system SHALL provide a localized registration page at `/register` containing only required first name, last name, email, and password controls, plus navigation to `/login`.

#### Scenario: Registration form defaults
- **WHEN** an unauthenticated user opens `/register`
- **THEN** the system displays the required registration fields without a currency control

#### Scenario: Authenticated user opens registration
- **WHEN** a user with a confirmed session navigates to `/register`
- **THEN** the system redirects the user to `/main`

### Requirement: Successful registration
The system SHALL create and establish the new session from a schema-valid registration response and restore
a validated internal destination when supplied, using `/main` otherwise.

#### Scenario: User registers successfully
- **WHEN** a user submits valid first name, last name, email, and password values and `/auth/register` returns a valid authentication response without a valid internal destination
- **THEN** the system persists the token, caches the returned user, and navigates to `/main`

#### Scenario: Optional profile values are omitted
- **WHEN** the registration form submits its payload
- **THEN** the system omits birth date, currency and notes from the registration request

#### Scenario: Registration restores an invitation destination
- **WHEN** registration succeeds with a valid internal redirect to `/join`
- **THEN** the system establishes the session and navigates to `/join` without accepting the pending invitation

#### Scenario: Registration rejects an external destination
- **WHEN** registration includes an external, protocol-relative, malformed or otherwise unsafe destination
- **THEN** the system ignores it and navigates to `/main`

### Requirement: Authentication form validation
The system SHALL validate authentication fields before submission using the frontend schemas that define the request contracts.

#### Scenario: Required registration identity is missing
- **WHEN** first name or last name is empty or contains only whitespace
- **THEN** the registration form displays a field-level required error and does not submit

#### Scenario: Email is invalid
- **WHEN** a login or registration email is not a valid email address
- **THEN** the form displays a field-level email error and does not submit

#### Scenario: Password is too short
- **WHEN** a login or registration password contains fewer than 8 characters
- **THEN** the form displays a field-level password error and does not submit

#### Scenario: Registration value exceeds its contract
- **WHEN** a first or last name exceeds 100 characters, or a password exceeds 128 characters
- **THEN** the registration form displays the corresponding field error and does not submit

#### Scenario: Authentication submission is pending
- **WHEN** a login or registration mutation is in progress
- **THEN** the system disables the form controls and displays a progress-specific submit label

### Requirement: Currency-aware user contract
The system SHALL validate auth/current-user responses without requiring defaultCurrency or defaultAccountId, and SHALL exclude these fields from profile changes. Registration SHALL send only firstName, lastName, email and password from the existing form; the API contract MAY accept optional notes without adding a new form control.

#### Scenario: Submit registration currency
- **WHEN** the registration form is submitted
- **THEN** no currency or defaultCurrency field is sent, including when old form data exists

#### Scenario: Validate an authenticated user
- **WHEN** login, registration, recovery completion or current-user lookup returns a user without financial defaults
- **THEN** the frontend accepts the response and establishes or preserves the confirmed session

#### Scenario: No authenticated currency selector
- **WHEN** an authenticated user opens profile or finance management
- **THEN** profile currency and default-account controls are absent and profile PATCH omits both removed fields
