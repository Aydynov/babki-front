## MODIFIED Requirements

### Requirement: Multicurrency account overview
The system SHALL present accounts of the selected space with their names, types, ISO currencies, and formatted amounts without combining amounts from different currencies. The default dashboard list SHALL contain active accounts only; the archive mode SHALL contain archived accounts only. Every space account returned by the API SHALL remain accessible through its matching list and details. Archived accounts SHALL retain historical context and SHALL NOT be selectable for new operations.

#### Scenario: Accounts in multiple currencies
- **WHEN** the user has active RUB and USD accounts
- **THEN** the account overview displays each account amount in its own currency
- **THEN** the system does not calculate a cross-currency total

#### Scenario: Account history at the selected period
- **WHEN** the dashboard period changes
- **THEN** account amounts are resolved from space account history at the selected period end date and displayed without replacing them with current balances

#### Scenario: Archived account
- **WHEN** an account has a non-null archive date
- **THEN** it appears only in the archive list and its details retain access to historical context and permitted management
- **THEN** the active dashboard list omits its account row and new-operation selectors exclude it

### Requirement: Account creation
The system SHALL let a user with manageAccounts create a named balance or saving account with an ISO currency, initial amount, and opening date. The active list's plus button SHALL open only the creation form, with an accessible name identifying account creation. Creation SHALL NOT display the existing-account management list. Existing creation actions from operation forms SHALL continue to open the creation form.

#### Scenario: Open account creation
- **WHEN** the user activates the account creation action
- **THEN** the dialog initializes an empty name, a balance type, an explicitly selectable currency with RUB as the initial form suggestion, an empty initial-amount field, and the current local date
- **THEN** the dialog displays only account creation, without renaming, archive or deletion actions for existing accounts

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

### Requirement: Account archive and deletion lifecycle
The system MUST distinguish archiving an account with history from permanently deleting an unused account. Management SHALL operate only on the account opened from its list. An archived account SHALL NOT offer repeated archival or creation of new financial operations. Existing confirmation, pending, error handling and dependent refresh rules SHALL remain in effect.

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
- **WHEN** an account is created, renamed, archived or deleted
- **THEN** space-scoped account, historical-balance, transaction, report, plan, debt, and expense-limit query families affected by the change are refreshed

#### Scenario: Dependent refresh fails
- **WHEN** the server confirms an account mutation but a dependent refresh fails
- **THEN** the system keeps the mutation successful and does not restore stale account state

## REMOVED Requirements

### Requirement: Default account selection
**Reason**: The backend removed defaultAccountId and defaultCurrency; spaces have no default account.
**Migration**: Remove default badges/actions and profile PATCH calls; require explicit active space account selection in financial forms.
