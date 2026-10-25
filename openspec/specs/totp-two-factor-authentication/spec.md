# totp-two-factor-authentication Specification

## Purpose

Provide a secure, accessible frontend experience for enrolling, inspecting, recovering, rotating, and disabling optional TOTP two-factor authentication.

## Requirements

### Requirement: Authenticated two-factor management
The system SHALL expose localized two-factor management from the account menu in the shared header on every authenticated page, subject to existing local-token restrictions, and SHALL present the backend-reported status and unused recovery-code count.

#### Scenario: Two-factor authentication is disabled
- **WHEN** an authenticated user opens two-factor management and the status response is `disabled`
- **THEN** the system offers to begin TOTP enrollment

#### Scenario: Two-factor authentication is enabled
- **WHEN** an authenticated user opens two-factor management and the status response is `enabled`
- **THEN** the system displays the number of unused recovery codes and actions to regenerate codes or disable TOTP

#### Scenario: Status cannot be loaded
- **WHEN** the two-factor status request fails or returns an invalid payload
- **THEN** the system displays an accessible retryable error without assuming that TOTP is disabled

#### Scenario: Open outside the dashboard
- **WHEN** an authenticated user outside local-token mode opens the account menu from the spaces directory, creation, settings or invitation page
- **THEN** the same two-factor management flow is available without navigating to the dashboard

### Requirement: Secure TOTP enrollment start
The system SHALL require the current password before starting or replacing a pending enrollment and SHALL retain provisioning values only for the active management flow.

#### Scenario: Enrollment starts successfully
- **WHEN** an eligible authenticated user submits the correct current password
- **THEN** the system accepts the returned Base32 secret, `otpauthUri`, and expiration time and proceeds to authenticator setup

#### Scenario: Enrollment password is rejected
- **WHEN** setup responds with an authentication failure
- **THEN** the system retains the management flow and reports that the credentials could not be verified

#### Scenario: Enrollment is unavailable
- **WHEN** setup responds that enrollment is already enabled or temporarily unavailable
- **THEN** the system reports the corresponding state and refreshes status where appropriate without displaying provisioning controls

#### Scenario: Pending enrollment is revisited without provisioning values
- **WHEN** status is `pending` but the current client flow does not hold its secret and `otpauthUri`
- **THEN** the system explains that setup must be restarted and requires the current password before replacing the pending enrollment

### Requirement: Local QR provisioning
The system SHALL generate the authenticator QR code entirely on the client from the backend-provided `otpauthUri`, SHALL provide the Base32 secret for manual setup, and MUST NOT send either provisioning value to an external QR service or diagnostic log.

#### Scenario: QR generation succeeds
- **WHEN** valid provisioning values are received
- **THEN** the system displays a locally generated QR code, the manual secret, and the setup expiration information

#### Scenario: QR generation fails
- **WHEN** the client cannot render the QR code
- **THEN** the system keeps the manual Base32 setup option available and reports the QR-specific failure without exposing the secret in logs

#### Scenario: Provisioning flow ends
- **WHEN** enrollment completes, expires, is restarted, or the management flow is dismissed
- **THEN** the system removes the provisioning secret and URI from client state and does not persist them in browser storage or query cache

### Requirement: Enrollment confirmation
The system SHALL enable TOTP only after a six-digit confirmation code succeeds before setup expiration and SHALL immediately adopt the replacement authenticated session returned by confirmation.

#### Scenario: Valid confirmation enables TOTP
- **WHEN** the user submits a valid six-digit TOTP for the active unexpired setup
- **THEN** the system stores the replacement access token, updates the current-user session data, clears provisioning values, and proceeds to the one-time recovery-code display

#### Scenario: Confirmation code is rejected
- **WHEN** setup confirmation responds with `401`
- **THEN** the system reports that the code or setup is invalid or expired and allows retry while the active setup remains available

#### Scenario: Setup expires in the client
- **WHEN** the setup expiration time is reached before confirmation succeeds
- **THEN** the system disables confirmation, removes provisioning values, and requires a new password-authorized setup

### Requirement: One-time recovery-code presentation
The system SHALL display all newly generated recovery codes only in the active success flow, support copying the complete set, and require explicit acknowledgement that the codes were saved before normal dismissal.

#### Scenario: Enrollment returns recovery codes
- **WHEN** setup confirmation returns a schema-valid authenticated session and ten distinct recovery codes
- **THEN** the system presents the codes as ten labelled read-only inputs in one fieldset arranged as two columns by five rows, with a warning that they are single-use and cannot be retrieved later

#### Scenario: User copies recovery codes
- **WHEN** the user activates the copy-all action and clipboard access succeeds
- **THEN** the system copies the complete formatted set and reports success without logging the codes

#### Scenario: Clipboard access fails
- **WHEN** the copy-all action cannot access the clipboard
- **THEN** the system reports the failure while keeping the codes visible for manual copying

#### Scenario: User attempts to dismiss unsaved codes
- **WHEN** the user has not acknowledged saving the displayed codes
- **THEN** the system prevents normal dismissal and explains that the codes will not be shown again

#### Scenario: Recovery-code flow ends
- **WHEN** the acknowledged recovery-code view is dismissed or replaced
- **THEN** the system removes the plaintext codes from client state and never persists them in browser storage or query cache

### Requirement: Recovery-code regeneration
The system SHALL allow an enabled user to replace all recovery codes using the current password and a current six-digit TOTP, and SHALL not offer recovery-code authorization for regeneration.

#### Scenario: Recovery codes are regenerated
- **WHEN** the user submits a valid current password and TOTP and receives replacement codes and an authenticated session
- **THEN** the system adopts the replacement access token, replaces the displayed remaining count, and presents the new codes through the one-time recovery-code flow

#### Scenario: Regeneration credentials are rejected
- **WHEN** the password or TOTP is rejected
- **THEN** the system preserves the enabled status, reports an authentication error, and does not claim that old codes were replaced

### Requirement: TOTP disabling
The system SHALL require the current password plus either a current TOTP or an unused recovery code before disabling two-factor authentication.

#### Scenario: User disables with TOTP
- **WHEN** the user submits a valid password and six-digit code using method `totp`
- **THEN** the system adopts the replacement session, refreshes status to `disabled`, and removes factor-management secrets from client state

#### Scenario: User switches to recovery for disabling
- **WHEN** the user selects recovery-code authorization in the disable flow
- **THEN** the system displays the recovery form and an action for returning to TOTP without clearing the entered password

#### Scenario: User disables with a recovery code
- **WHEN** the user submits a valid password and recovery code using method `recovery`
- **THEN** the system adopts the replacement session and refreshes status to `disabled`

#### Scenario: Disable credentials are rejected
- **WHEN** the password or selected second factor is rejected
- **THEN** the system preserves the enabled status and displays an accessible authentication error

### Requirement: Authentication-state replacement
The system SHALL handle enrollment confirmation, recovery-code regeneration, and TOTP disabling as identity-preserving session replacements and SHALL prevent requests made with the invalidated token from ending the replacement session.

#### Scenario: Management operation rotates the token
- **WHEN** a factor-management response contains a schema-valid replacement access token and current user
- **THEN** the system activates that token, keeps the same user signed in, updates affected query data, and resets unauthorized-session deduplication

#### Scenario: Old request fails after management succeeds
- **WHEN** an in-flight request carrying the invalidated token later responds with `401`
- **THEN** the system ignores that response because it does not belong to the active token

### Requirement: Two-factor management feedback
The system SHALL provide responsive, keyboard-accessible validation and localized status-specific errors for all two-factor management forms.

#### Scenario: Management form is pending
- **WHEN** a setup, confirmation, regeneration, disable, copy, or QR-generation action is pending
- **THEN** relevant controls prevent duplicate actions and expose progress or result feedback without hiding required recovery information

#### Scenario: A lifecycle request can return one-time secrets
- **WHEN** confirmation or regeneration is pending
- **THEN** every normal dialog dismissal path remains blocked until the response is handled and any returned recovery codes are presented

#### Scenario: Management dialog closes
- **WHEN** the user dismisses a management view that is allowed to close
- **THEN** the system keeps the active content mounted throughout the close transition and clears its state only after the transition completes

#### Scenario: Management verification is rate-limited
- **WHEN** a factor-management endpoint responds with `429` and `Retry-After`
- **THEN** the system reports the temporary block and prevents immediate resubmission for the indicated interval

#### Scenario: Narrow viewport
- **WHEN** the management flow is opened on a narrow viewport
- **THEN** QR, manual secret, Input OTP controls, forms, and recovery-code fields remain readable inside the dialog without horizontal overflow
