## MODIFIED Requirements

### Requirement: Transfer entry point and account selection
The system SHALL provide transfer management from account details opened on the dashboard,
without a separate transfers widget, and require two different active balance or saving accounts of the selected space.

#### Scenario: Open a new transfer
- **WHEN** the user activates the transfer action in account details
- **THEN** the dialog presents read-only source account information, a destination account selector, source and destination amounts,
  transaction date, and optional description
- **THEN** the open account is fixed as the source and its balance in the account currency is visible read-only beside “Списать с текущего счета”, without its name

#### Scenario: Account eligibility
- **WHEN** a source account is selected
- **THEN** the destination selector excludes that account and every archived account

#### Scenario: Insufficient eligible accounts
- **WHEN** fewer than two active accounts exist
- **THEN** the transfer action explains that another account is required and prevents submission

#### Scenario: Dashboard composition
- **WHEN** the dashboard is displayed
- **THEN** there is no standalone transfers widget
- **THEN** transfer creation, editing, and deletion are reachable through account details

### Requirement: Transfer history and editing
The system SHALL display compact signed transfer effects in account details and allow only amounts
and description to be edited. Full paired context SHALL remain available in transfer editing.

#### Scenario: Present a transfer
- **WHEN** a transfer is listed in account details
- **THEN** it shows the counterparty account, date, and the signed amount in the open account currency
- **THEN** editing and deletion are available only to its author, the space owner or manageTransactions, and only while both accounts are active

#### Scenario: Edit a transfer
- **WHEN** the user edits an existing transfer
- **THEN** its accounts and transaction date remain read-only while its permitted amounts and description can change
- **THEN** both currency amounts, description, and effective rate are available in the editing context

#### Scenario: Filter by account
- **WHEN** transfer history is requested for one account
- **THEN** transfers where that account is either the source or destination are included

#### Scenario: Return from transfer management
- **WHEN** the user finishes or cancels transfer creation, editing, or deletion
- **THEN** account details remain available and successful mutations refresh affected histories and balances
- **THEN** deletion retains its confirmation and recoverable failure behavior

### Requirement: Transfer validation and consistency
The system SHALL reject invalid local inputs and refresh every affected account and aggregate after a confirmed mutation.

#### Scenario: Invalid amount precision
- **WHEN** either amount exceeds the minor-unit precision of its currency
- **THEN** the form displays the corresponding field error and does not submit

#### Scenario: Insufficient funds
- **WHEN** the API rejects a transfer because the source lacks funds
- **THEN** the dialog preserves all values and associates an actionable error with the source amount

#### Scenario: Transfer mutation succeeds
- **WHEN** a transfer is created, updated, or deleted
- **THEN** transfer, general transaction, space-scoped account, historical-balance, and report query families are refreshed for both accounts
