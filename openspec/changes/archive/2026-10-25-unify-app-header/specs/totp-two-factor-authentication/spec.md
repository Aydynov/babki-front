# Spec Delta

## MODIFIED Requirements

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
