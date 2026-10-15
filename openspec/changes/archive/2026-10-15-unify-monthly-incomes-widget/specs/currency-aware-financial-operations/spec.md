# Currency-aware Financial Operations Delta

## MODIFIED Requirements

### Requirement: Income account selection
The system SHALL require an active balance account in the currency of the income widget row when creating income.
The selector SHALL show only these accounts and SHALL treat the selected account as the income currency source.
The row currency SHALL remain fixed for that form session.

#### Scenario: Initialize income creation
- **WHEN** the user opens income creation from a currency row and the default account is active, balance type,
  and in that currency
- **THEN** that account is preselected while only active balance accounts in the row currency remain selectable
- **THEN** saving accounts, archived accounts and accounts in other currencies are absent from the selector

#### Scenario: Submit income
- **WHEN** the user submits valid income values with an eligible account
- **THEN** the request contains `accountId` and does not send a separate currency
- **THEN** amount precision is validated against the selected account currency

#### Scenario: No active accounts
- **WHEN** the user has no active balance account in the row currency
- **THEN** income submission is unavailable and the form links the user to account creation
- **THEN** active saving accounts or balance accounts in another currency do not bypass this state

#### Scenario: Default account is incompatible
- **WHEN** the default account is missing, archived, saving type or in another currency
- **THEN** it is not preselected and the user explicitly chooses from the eligible accounts

#### Scenario: Selected account becomes unavailable
- **WHEN** a selected account is no longer active or eligible after account data refresh
- **THEN** it cannot be submitted, its selection is cleared and the remaining eligible accounts are offered

#### Scenario: Account creation returns to income form
- **WHEN** account creation completes while the income form remains open
- **THEN** the selector refreshes and includes the new account only if it is active, balance type and in the row currency
- **THEN** an incompatible new account does not enable submission
