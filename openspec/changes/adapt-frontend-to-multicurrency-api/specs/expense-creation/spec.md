## ADDED Requirements

### Requirement: Explicit expense account
The system SHALL require an active personal account for expense creation and SHALL derive the expense currency from that account.

#### Scenario: Initialize account selection
- **WHEN** the user opens expense creation and the authenticated user's default account is active
- **THEN** that account is preselected and every active personal account remains available

#### Scenario: Default account is unavailable
- **WHEN** `defaultAccountId` is null, archived, or absent from loaded accounts
- **THEN** the form leaves account selection empty and requires an explicit choice

#### Scenario: Map expense account
- **WHEN** the user submits a valid expense
- **THEN** the create request includes the selected `accountId` and does not send a separate currency

#### Scenario: Validate expense precision
- **WHEN** the amount or an item price exceeds the selected account currency's supported precision
- **THEN** the form displays a field-level error and does not submit

#### Scenario: No active account
- **WHEN** no active personal account exists
- **THEN** expense submission is unavailable and the dialog offers account creation

