## Purpose

Define creation and lifecycle management of atomic movements between personal accounts in the same or different currencies.

## ADDED Requirements

### Requirement: Transfer entry point and account selection
The system SHALL provide transfer management from the dashboard and require two different active personal accounts.

#### Scenario: Open a new transfer
- **WHEN** the user activates the transfer action
- **THEN** the dialog presents source and destination account selectors, source and destination amounts, transaction date, and optional description

#### Scenario: Account eligibility
- **WHEN** a source account is selected
- **THEN** the destination selector excludes that account and every archived account

#### Scenario: Insufficient eligible accounts
- **WHEN** fewer than two active accounts exist
- **THEN** the transfer action explains that another account is required and prevents submission

### Requirement: Same-currency transfer
The system SHALL treat equal source and destination amounts as one editable amount for a same-currency transfer.

#### Scenario: Select accounts with the same currency
- **WHEN** both selected accounts use the same currency
- **THEN** changing the transfer amount keeps source and destination amounts equal
- **THEN** the form displays that no conversion is involved

#### Scenario: Invalid same-currency amounts from existing data
- **WHEN** an existing same-currency transfer contains unequal source and destination amounts
- **THEN** the response is rejected as contract-invalid instead of being silently displayed

### Requirement: Cross-currency transfer
The system SHALL collect both actual monetary amounts and show their directed effective rate for accounts with different currencies.

#### Scenario: Select accounts with different currencies
- **WHEN** source and destination currencies differ
- **THEN** the form enables independent positive source and destination amounts with currency-specific precision

#### Scenario: Preview effective rate
- **WHEN** both cross-currency amounts are valid
- **THEN** the form displays the derived destination-per-source rate with its base and quote currencies

#### Scenario: Submit cross-currency transfer
- **WHEN** the user submits a valid cross-currency transfer
- **THEN** the request includes both account ids, both numeric amounts, the transaction date, and any description

### Requirement: Transfer history and editing
The system SHALL display transfers as paired outgoing and incoming effects and allow only amounts and description to be edited.

#### Scenario: Present a transfer
- **WHEN** a transfer is listed
- **THEN** it shows source and destination account context, both currency amounts, date, description, and effective rate

#### Scenario: Edit a transfer
- **WHEN** the user edits an existing transfer
- **THEN** its accounts and transaction date remain read-only while its permitted amounts and description can change

#### Scenario: Filter by account
- **WHEN** transfer history is requested for one account
- **THEN** transfers where that account is either the source or destination are included

### Requirement: Transfer deletion
The system MUST require confirmation before deleting a transfer and SHALL preserve recoverable feedback for failures.

#### Scenario: Confirm deletion
- **WHEN** the user confirms transfer deletion and the request succeeds
- **THEN** the transfer is removed from visible histories and both account effects are refreshed

#### Scenario: Delete failure
- **WHEN** deletion fails
- **THEN** the confirmation remains available, the transfer stays visible, and a localized retryable error is shown

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
- **THEN** transfer, general transaction, account, snapshot, and report query families are refreshed for both accounts

