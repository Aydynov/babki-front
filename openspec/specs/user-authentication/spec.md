## Purpose

Define secure, accessible, and responsive user authentication, session protection, and logout behavior for the finance application.

## Requirements

### Requirement: Public login page
The system SHALL provide a localized login page at `/login` with labeled email and password fields, a submit action, and navigation to `/register`.

#### Scenario: Unauthenticated user opens login
- **WHEN** a user without a valid session navigates to `/login`
- **THEN** the system displays the login form and a link to the registration page

#### Scenario: Authenticated user opens login
- **WHEN** a user with a confirmed session navigates to `/login`
- **THEN** the system redirects the user to `/main`

### Requirement: Successful login
The system SHALL distinguish a schema-valid authenticated-session response from a schema-valid two-factor challenge, establish a session only after an authenticated-session response, and navigate only after authentication is complete.

#### Scenario: Login without a restored destination
- **WHEN** a user completes password-only or two-factor login without a valid redirect query value
- **THEN** the system stores the returned access token, caches the current user, and navigates to `/main`

#### Scenario: Login restores an internal destination
- **WHEN** a user completes password-only or two-factor login with a redirect query value containing a valid internal application path
- **THEN** the system stores the returned access token, caches the current user, and navigates to that internal path

#### Scenario: Password login requires a second factor
- **WHEN** a user with enabled TOTP submits valid login credentials and receives a two-factor challenge
- **THEN** the system does not establish a session or navigate and instead displays the TOTP step for that challenge

#### Scenario: Login rejects an external destination
- **WHEN** a completed password-only or two-factor login includes a redirect query value that is external, protocol-relative, or otherwise invalid
- **THEN** the system ignores that value and navigates to `/main`

### Requirement: Login failure feedback
The system SHALL retain entered login values and display localized, accessible feedback when authentication fails.

#### Scenario: Credentials are rejected
- **WHEN** `/auth/login` responds with `401`
- **THEN** the login page reports that the email or password is incorrect without invoking the expired-session redirect flow

#### Scenario: Login response is invalid
- **WHEN** `/auth/login` succeeds at the transport level but its payload does not match the expected authentication response schema
- **THEN** the login page reports a general retryable error and does not establish a session

#### Scenario: Login request fails unexpectedly
- **WHEN** the login request fails because of a network error, server error, or unrecognized response
- **THEN** the login page reports a general retryable error without clearing the entered values

### Requirement: Public registration page
The system SHALL provide a localized registration page at `/register` containing only required first name, last name, email, password, and currency controls, plus navigation to `/login`.

#### Scenario: Registration form defaults
- **WHEN** an unauthenticated user opens `/register`
- **THEN** the system displays the required registration fields with currency initialized to `RUB`

#### Scenario: Authenticated user opens registration
- **WHEN** a user with a confirmed session navigates to `/register`
- **THEN** the system redirects the user to `/main`

### Requirement: Successful registration
The system SHALL create and establish the new session from a schema-valid registration response.

#### Scenario: User registers successfully
- **WHEN** a user submits valid first name, last name, email, password, and currency values and `/auth/register` returns a valid authentication response
- **THEN** the system persists the token, caches the returned user, and navigates to `/main`

#### Scenario: Optional profile values are omitted
- **WHEN** the registration form submits its payload
- **THEN** the system omits birth date and notes from the registration request

### Requirement: Registration failure feedback
The system SHALL preserve registration input and display localized, accessible feedback when account creation fails.

#### Scenario: Email is already registered
- **WHEN** `/auth/register` responds with `409`
- **THEN** the registration page reports that the email is already associated with an account

#### Scenario: Registration response is invalid
- **WHEN** `/auth/register` succeeds at the transport level but its payload does not match the expected authentication response schema
- **THEN** the registration page reports a general retryable error and does not establish a session

#### Scenario: Registration request fails unexpectedly
- **WHEN** the registration request fails because of a network error, server error, or unrecognized response
- **THEN** the registration page reports a general retryable error without clearing the entered values

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
- **WHEN** a first or last name exceeds 100 characters, a password exceeds 128 characters, or currency is not a three-letter code
- **THEN** the registration form displays the corresponding field error and does not submit

#### Scenario: Authentication submission is pending
- **WHEN** a login or registration mutation is in progress
- **THEN** the system disables the form controls and displays a progress-specific submit label

### Requirement: Password visibility control
The system SHALL provide an accessible visibility toggle for the password fields on the login and registration forms.

#### Scenario: Password is masked by default
- **WHEN** a user opens the login or registration form
- **THEN** the password field masks its value and the toggle offers to show the password

#### Scenario: User toggles password visibility
- **WHEN** the user activates the eye-icon toggle
- **THEN** the field switches between masked and visible text without changing its value, validation state, or autocomplete behavior

#### Scenario: Visibility toggle accessibility and pending state
- **WHEN** the visibility toggle is available or the authentication form is submitting
- **THEN** the toggle exposes a localized action label, reflects its pressed state, has visible keyboard focus, and is disabled together with the form controls

### Requirement: Protected route access
The system SHALL place `/main` and future private finance routes behind one route-level session boundary that confirms the current user.

#### Scenario: User without a token opens a private route
- **WHEN** a user without an access token navigates to a protected route
- **THEN** the system redirects to `/login` with the requested internal location encoded as the redirect query value

#### Scenario: User with a valid token opens a private route
- **WHEN** a user with an access token navigates to a protected route and `/users/me` confirms the session
- **THEN** the system renders the protected route using the confirmed current-user data

#### Scenario: Root route is opened without a session
- **WHEN** a user without a valid session navigates to `/`
- **THEN** the system redirects to `/login`

#### Scenario: Root route is opened with a session
- **WHEN** a user with a confirmed session navigates to `/`
- **THEN** the system redirects to `/main`

### Requirement: Expired session handling
The system SHALL end a stored session only when an authenticated resource request made with the currently active Bearer token returns `401`, and SHALL preserve a safe return destination.

#### Scenario: Authenticated request is rejected
- **WHEN** a non-public-auth endpoint request carrying the currently active Bearer token responds with `401`
- **THEN** the system clears the stored token and all query data and replaces the current route with `/login` carrying the current internal location as the redirect value

#### Scenario: Multiple requests reject the same session
- **WHEN** concurrent authenticated requests carrying the same active token respond with `401`
- **THEN** the system performs one effective session invalidation and does not start competing redirects

#### Scenario: Current-user check rejects a token
- **WHEN** `/users/me` responds with an authentication failure while confirming a protected navigation with the active token
- **THEN** the system does not retry the authentication failure, clears the session, and redirects to login

#### Scenario: Obsolete request fails after token rotation
- **WHEN** a request made with an earlier Bearer token returns `401` after a replacement access token has become active
- **THEN** the system ignores that stale rejection and preserves the replacement session and its query data

#### Scenario: Public two-factor login is rejected
- **WHEN** `/auth/login/two-factor` responds with `401`
- **THEN** the system reports the failure inside the login flow without invoking expired-session handling

### Requirement: User logout
The system SHALL expose a logout action in the authenticated main-page header and SHALL remove all user-specific client state when activated.

#### Scenario: User logs out
- **WHEN** an authenticated user activates logout
- **THEN** the system clears the stored access token and entire query cache and replaces the current route with `/login`

#### Scenario: Browser history after logout
- **WHEN** a logged-out user navigates backward to a previously protected location
- **THEN** the protected route guard redirects the user to login instead of rendering cached private data

### Requirement: Local development token mode
The system SHALL preserve environment-provided local authentication behavior when `FRONT_USE_LOCAL_AUTH_TOKEN=true` and SHALL hide session or factor management actions that cannot replace or clear that environment token.

#### Scenario: Local token mode opens an auth page
- **WHEN** a valid environment-provided local token is active and the user navigates to `/login` or `/register`
- **THEN** the system bypasses the auth page and navigates to `/main`

#### Scenario: Local token mode displays authenticated navigation
- **WHEN** the application uses an environment-provided local token
- **THEN** the main-page header does not display logout or two-factor management actions

### Requirement: Responsive and accessible authentication UI
The system SHALL present password and second-factor authentication steps as responsive localized forms with accessible semantics and feedback.

#### Scenario: Wide viewport
- **WHEN** an authentication step is rendered at a wide viewport
- **THEN** the system displays product messaging beside the active authentication form

#### Scenario: Narrow viewport
- **WHEN** an authentication step is rendered at a narrow viewport
- **THEN** the system places a compact brand header above a full-width form without horizontal overflow

#### Scenario: Keyboard and assistive technology use
- **WHEN** a user navigates a password, TOTP, or recovery form by keyboard or submits invalid values
- **THEN** controls follow logical tab order, labels identify their controls, focus remains visible, and validation or form-level errors are announced accessibly

### Requirement: Two-factor login challenge
The system SHALL keep a two-factor login challenge only in the active login flow, default the challenge to TOTP entry, expose its expiration, and never persist the challenge as an access token, URL value, or browser-storage value.

#### Scenario: Challenge is received
- **WHEN** password login returns `requiresTwoFactor: true`, a schema-valid challenge token, and an expiration time
- **THEN** the system clears the retained password, keeps the challenge in memory, and presents the TOTP form without storing an authenticated session

#### Scenario: Login page is refreshed during a challenge
- **WHEN** the browser reloads or remounts the login page while a challenge is active
- **THEN** the challenge is discarded and the user is returned to the email-and-password step

#### Scenario: User restarts password login
- **WHEN** the user chooses to return from the second-factor step to password login
- **THEN** the system discards the active challenge and requires new primary credentials

### Requirement: TOTP and recovery login methods
The system SHALL provide separate TOTP and recovery-code forms for the active challenge and SHALL allow the user to switch between them without requesting a new challenge.

#### Scenario: TOTP is submitted
- **WHEN** the user enters exactly six decimal digits and submits the default TOTP form
- **THEN** the system accepts the value through the shared accessible Input OTP control and completes the challenge using method `totp` and the entered code

#### Scenario: User selects recovery login
- **WHEN** the user activates the recovery-code action from the TOTP form
- **THEN** the system displays a labeled recovery-code form and an action for returning to TOTP

#### Scenario: Recovery code is submitted
- **WHEN** the user enters a case-insensitive recovery code with optional spaces or hyphens
- **THEN** the system validates and normalizes the value and completes the same challenge using method `recovery`

#### Scenario: Second-factor submission is pending
- **WHEN** a TOTP or recovery-code request is in progress
- **THEN** the system disables the active form controls and method-switching actions and displays a progress-specific submit label

### Requirement: Two-factor login failure feedback
The system SHALL retain the active challenge after retryable factor failures and display localized, accessible guidance without exposing protected challenge state.

#### Scenario: Factor or challenge is rejected
- **WHEN** challenge completion responds with `401`
- **THEN** the system reports that the code or login challenge is invalid or expired, retains the entered method, and offers to retry or restart login

#### Scenario: Factor verification is rate-limited
- **WHEN** challenge completion responds with `429` and a `Retry-After` value
- **THEN** the system reports the temporary block and prevents immediate resubmission for the indicated interval

#### Scenario: Challenge response is invalid
- **WHEN** challenge completion succeeds at the transport level but does not match the authenticated-session schema
- **THEN** the system reports a general retryable error and does not establish a session

### Requirement: Currency-aware user contract
The system SHALL use `defaultCurrency` and nullable `defaultAccountId` in authenticated user contracts while deferring authenticated profile-currency controls to a future change.

#### Scenario: Submit registration currency
- **WHEN** the registration form submits a supported currency
- **THEN** the frontend maps that form value to the backend request field `currency`

#### Scenario: Validate an authenticated user
- **WHEN** login, registration, or current-user lookup returns a user
- **THEN** the response is accepted only when it includes a supported `defaultCurrency` and a valid object id or null `defaultAccountId`

#### Scenario: No authenticated currency selector
- **WHEN** an authenticated user opens the dashboard in this change
- **THEN** the UI does not expose a control for changing `defaultCurrency`
