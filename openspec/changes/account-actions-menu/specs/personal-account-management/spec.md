# Spec Delta

## MODIFIED Requirements

### Requirement: Account renaming
The system SHALL allow an account name to change while treating its type, currency, initial amount, and opening date as immutable.

#### Scenario: Rename an account
- **WHEN** the user submits a valid changed account name
- **THEN** the system sends only the new name and updates the matching cached account from the server response

#### Scenario: Immutable account attributes
- **WHEN** the user opens account editing
- **THEN** the form presents only a labeled account-name input and a save action; type, currency, balance, initial amount, opening date, and status are absent from the form and remain available in account details

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
- **THEN** only that account is managed through a menu offering editing and deletion; its status and immutable attributes remain visible in the underlying details, outside the editing form
- **THEN** renaming and deletion retain existing API restrictions and confirmations
- **THEN** repeated archival, default selection and creation of new operations are unavailable

