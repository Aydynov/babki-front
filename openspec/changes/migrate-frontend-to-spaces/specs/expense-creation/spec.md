## MODIFIED Requirements

### Requirement: Refresh every creation-dependent query
The system SHALL begin reconciliation of all client data affected by a server-confirmed expense creation without
reclassifying a successful creation as failed when a dependent refresh fails.

#### Scenario: Refresh expense-derived views
- **WHEN** expense creation succeeds
- **THEN** the system invalidates expense queries used by the table, daily chart, and category aggregation
- **THEN** the system invalidates expense-limit and report query families

#### Scenario: Refresh account-derived views
- **WHEN** expense creation succeeds and the response identifies the affected account
- **THEN** the system invalidates balance queries and space-scoped account timeline and historical-balance queries for that account

#### Scenario: Refresh general transactions
- **WHEN** expense creation succeeds
- **THEN** the system invalidates general transaction-list queries

#### Scenario: Dependent refresh fails after creation
- **WHEN** the server has confirmed creation but one or more dependent query refreshes fail
- **THEN** the system does not keep or reopen the dialog, restore submitted values, or report the creation itself as
  failed

### Requirement: Explicit expense account
The system SHALL require an active balance or saving account of the selected space for expense creation and SHALL derive the expense currency from that account.

#### Scenario: Initialize account selection
- **WHEN** the user opens expense creation
- **THEN** selection starts empty and an explicit active balance or saving account of the selected space is required

#### Scenario: Default account is unavailable
- **WHEN** old local state contains defaultAccountId
- **THEN** it is ignored and no profile default is requested or sent

#### Scenario: Map expense account
- **WHEN** the user submits a valid expense
- **THEN** the create request includes the selected `accountId` and does not send a separate currency

#### Scenario: Validate expense precision
- **WHEN** the amount or an item price exceeds the selected account currency's supported precision
- **THEN** the form displays a field-level error and does not submit

#### Scenario: No active account
- **WHEN** no active balance or saving account of the selected space exists
- **THEN** expense submission is unavailable and the dialog offers account creation only with manageAccounts, otherwise explains the required owner action
