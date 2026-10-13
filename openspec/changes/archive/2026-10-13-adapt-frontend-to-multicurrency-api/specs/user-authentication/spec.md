## ADDED Requirements

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
