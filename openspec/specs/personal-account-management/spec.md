# personal-account-management Specification

## Purpose

Define how users view and manage multiple named personal balance and saving accounts with explicit currencies and lifecycle states.

## Requirements

### Requirement: Multicurrency account overview
The system SHALL present personal accounts with their names, types, ISO currencies, and formatted amounts without combining amounts from different currencies. The default dashboard list SHALL contain active accounts only; the archive mode SHALL contain archived accounts only. Every personal account returned by the API SHALL remain accessible through its matching list and details. Archived accounts SHALL retain historical context and SHALL NOT be selectable for new operations.

#### Scenario: Accounts in multiple currencies
- **WHEN** the user has active RUB and USD accounts
- **THEN** the account overview displays each account amount in its own currency
- **THEN** the system does not calculate a cross-currency total

#### Scenario: Account history at the selected period
- **WHEN** the dashboard period changes
- **THEN** account amounts are requested at the selected period end date and displayed without replacing them with current balances

#### Scenario: Archived account
- **WHEN** an account has a non-null archive date
- **THEN** it appears only in the archive list and its details retain access to historical context and permitted management
- **THEN** the active dashboard list omits its account row and new-operation selectors exclude it

### Requirement: Account creation
The system SHALL let the user create a named balance or saving account with an ISO currency, initial amount, and opening date. The active list's plus button SHALL open only the creation form, with an accessible name identifying account creation. Creation SHALL NOT display the existing-account management list. Existing creation actions from operation forms SHALL continue to open the creation form.

#### Scenario: Open account creation
- **WHEN** the user activates the account creation action
- **THEN** the dialog initializes an empty name, a balance type, the authenticated user's default currency, an empty initial-amount field, and the current local date
- **THEN** the dialog displays only account creation, without renaming, default selection, archive or deletion actions for existing accounts

#### Scenario: Submit a valid account
- **WHEN** the user submits valid account values
- **THEN** the system sends `name`, `type`, `currency`, numeric `amount`, and `openedAt` to the accounts API
- **THEN** the returned account becomes visible in the overview

#### Scenario: Currency precision is invalid
- **WHEN** the initial amount has more fractional digits than the selected currency supports
- **THEN** the system displays a field error and does not submit

#### Scenario: Create from an operation form
- **WHEN** an operation form offers account creation because no eligible account exists and the user activates it
- **THEN** the dedicated account creation form opens
- **THEN** the archive list does not gain an add button

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
The system MUST distinguish archiving an account with history from permanently deleting an unused account. Management SHALL operate only on the account opened from its list. An archived account SHALL NOT offer repeated archival, default selection, or creation of new financial operations. Existing confirmation, pending, error handling and dependent refresh rules SHALL remain in effect.

#### Scenario: Archive account
- **WHEN** the user confirms archival and the API succeeds
- **THEN** the account becomes unavailable to new operations and disappears from the active dashboard list
- **THEN** the account remains available through the archive list and its details
- **THEN** management and details close, the active list remains selected and focus moves to its archive button

#### Scenario: Delete unused account
- **WHEN** the user confirms deletion of an account with no initial balance or financial history and the API succeeds
- **THEN** the account is removed from the overview
- **THEN** management and details close, the selected list mode remains unchanged and focus moves to its visible mode-switch button

#### Scenario: Deletion is restricted
- **WHEN** permanent deletion is rejected because the account has a balance or history
- **THEN** the system preserves the account and offers archival as the recoverable alternative for an active account
- **THEN** an already archived account remains archived without an option to archive again

#### Scenario: Archived account management
- **WHEN** the user opens management from the details of an archived account
- **THEN** only that account is managed, with its archived status and existing immutable attributes visible
- **THEN** renaming and deletion retain existing API restrictions and confirmations
- **THEN** repeated archival, default selection and creation of new operations are unavailable

### Requirement: Account mutation consistency
The system SHALL reconcile account mutations with all dependent financial data without combining mutation success with later refresh failures.

#### Scenario: Account mutation succeeds
- **WHEN** an account is created, renamed, archived, deleted, or selected as default
- **THEN** account, user, snapshot, transaction, report, plan, debt, and expense-limit query families affected by the change are refreshed

#### Scenario: Dependent refresh fails
- **WHEN** the server confirms an account mutation but a dependent refresh fails
- **THEN** the system keeps the mutation successful and does not restore stale account state

### Requirement: Clear account creation form
The system SHALL present the account creation form without an extra enclosing border. Every field SHALL have a visible associated label: account name, account type, currency, initial amount and opening date. Type and currency SHALL use styled dropdown controls consistent with the application, with keyboard navigation and a visible selected value.

#### Scenario: Understand and select account attributes
- **WHEN** the user opens account creation
- **THEN** labels identify every field without relying on placeholders or current values
- **THEN** type and currency are styled dropdowns with visible selected values, keyboard navigation and selection
- **THEN** the form has no additional enclosing outline inside the dialog

### Requirement: Optional initial amount entry
The system SHALL initialize and reset the initial-amount field to an empty value. An omitted initial amount SHALL be submitted as numeric zero. Entered amounts SHALL retain existing non-negative and currency precision validation.

#### Scenario: Submit without an initial amount
- **WHEN** the user leaves the amount empty and submits otherwise valid values
- **THEN** the request contains numeric `amount: 0`
- **THEN** the user does not need to delete a prefilled zero before entering an amount

#### Scenario: Reset after creation or reopen
- **WHEN** successful creation resets the form or the user reopens creation
- **THEN** the initial-amount input is empty again

### Requirement: Full-width amount and opening date fields
The system SHALL place initial amount and opening date vertically, each occupying the available form width at every screen size. Currency precision feedback SHALL appear below the amount, using the full field width without clipping or horizontal overflow. Validation feedback SHALL remain associated with the amount input.

#### Scenario: Precision feedback has room
- **WHEN** an entered amount exceeds the selected currency's precision
- **THEN** the error appears below the amount and before the opening-date field
- **THEN** amount and date remain in separate rows on desktop and mobile, and the error is readable without horizontal overflow
