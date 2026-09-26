## Purpose

Define how users view and manage multiple named personal balance and saving accounts with explicit currencies and lifecycle states.

## ADDED Requirements

### Requirement: Multicurrency account overview
The system SHALL present every personal account returned by the API with its name, type, ISO currency, formatted amount, and lifecycle state without combining amounts from different currencies.

#### Scenario: Accounts in multiple currencies
- **WHEN** the user has active RUB and USD accounts
- **THEN** the account overview displays each account amount in its own currency
- **THEN** the system does not calculate a cross-currency total

#### Scenario: Account history at the selected period
- **WHEN** the dashboard period changes
- **THEN** account amounts are requested at the selected period end date and displayed without replacing them with current balances

#### Scenario: Archived account
- **WHEN** an account has a non-null archive date
- **THEN** the overview identifies it as archived and excludes it from new-operation selectors

### Requirement: Account creation
The system SHALL let the user create a named balance or saving account with an ISO currency, initial amount, and opening date.

#### Scenario: Open account creation
- **WHEN** the user activates the account creation action
- **THEN** the dialog initializes an empty name, a balance type, the authenticated user's default currency, a zero initial amount, and the current local date

#### Scenario: Submit a valid account
- **WHEN** the user submits valid account values
- **THEN** the system sends `name`, `type`, `currency`, numeric `amount`, and `openedAt` to the accounts API
- **THEN** the returned account becomes visible in the overview

#### Scenario: Currency precision is invalid
- **WHEN** the initial amount has more fractional digits than the selected currency supports
- **THEN** the system displays a field error and does not submit

### Requirement: Account renaming
The system SHALL allow an account name to change while treating its type, currency, initial amount, and opening date as immutable.

#### Scenario: Rename an account
- **WHEN** the user submits a valid changed account name
- **THEN** the system sends only the new name and updates the matching cached account from the server response

#### Scenario: Immutable account attributes
- **WHEN** the user opens account editing
- **THEN** type, currency, initial amount, and opening date are presented as read-only context rather than editable fields

### Requirement: Default account selection
The system SHALL identify the authenticated user's default account and allow choosing another active balance account only when its currency matches the user's default currency.

#### Scenario: Current default account
- **WHEN** an account id equals the authenticated user's `defaultAccountId`
- **THEN** the account is visibly identified as the default

#### Scenario: Choose a compatible default account
- **WHEN** the user selects an active balance account in `defaultCurrency`
- **THEN** the system updates `defaultAccountId`, refreshes the authenticated user, and reflects the new default indicator

#### Scenario: Incompatible account
- **WHEN** an account is a saving account, archived, or denominated in another currency
- **THEN** the system does not offer it as a default-account choice

### Requirement: Account archive and deletion lifecycle
The system MUST distinguish archiving an account with history from permanently deleting an unused account.

#### Scenario: Archive account
- **WHEN** the user confirms archival and the API succeeds
- **THEN** the account becomes unavailable to new operations while remaining visible with its history

#### Scenario: Delete unused account
- **WHEN** the user confirms deletion of an account with no initial balance or financial history and the API succeeds
- **THEN** the account is removed from the overview

#### Scenario: Deletion is restricted
- **WHEN** permanent deletion is rejected because the account has a balance or history
- **THEN** the system preserves the account and offers archival as the recoverable alternative

### Requirement: Account mutation consistency
The system SHALL reconcile account mutations with all dependent financial data without combining mutation success with later refresh failures.

#### Scenario: Account mutation succeeds
- **WHEN** an account is created, renamed, archived, deleted, or selected as default
- **THEN** account, user, snapshot, transaction, report, plan, debt, and expense-limit query families affected by the change are refreshed

#### Scenario: Dependent refresh fails
- **WHEN** the server confirms an account mutation but a dependent refresh fails
- **THEN** the system keeps the mutation successful and does not restore stale account state

