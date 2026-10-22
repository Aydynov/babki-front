## MODIFIED Requirements

### Requirement: Income account selection
The system SHALL require an active balance or saving account in the currency of the income widget row when creating income.
The selector SHALL show only these accounts and SHALL treat the selected account as the income currency source.
The row currency SHALL remain fixed for that form session.

#### Scenario: Initialize income creation
- **WHEN** the user opens income creation from a currency row
- **THEN** no profile default is used and an explicit active balance or saving account in that space and currency is required
- **THEN** archived accounts and accounts in other spaces or currencies are absent from the selector

#### Scenario: Submit income
- **WHEN** the user submits valid income values with an eligible account
- **THEN** the request contains `accountId` and does not send a separate currency
- **THEN** amount precision is validated against the selected account currency

#### Scenario: No active accounts
- **WHEN** the user has no active balance or saving account in the row currency
- **THEN** income submission is unavailable and the form offers account creation only with manageAccounts, otherwise explains the required owner action
- **THEN** accounts in another currency or space do not bypass this state

#### Scenario: Default account is incompatible
- **WHEN** obsolete default-account data exists locally
- **THEN** it does not preselect or authorize an account in the form

#### Scenario: Selected account becomes unavailable
- **WHEN** a selected account is no longer active or eligible after account data refresh
- **THEN** it cannot be submitted, its selection is cleared and the remaining eligible accounts are offered

#### Scenario: Account creation returns to income form
- **WHEN** account creation completes while the income form remains open
- **THEN** the selector refreshes and includes the new account only if it is active, in the selected space and in the row currency
- **THEN** an incompatible new account does not enable submission

### Requirement: Currency-scoped plans
The system SHALL create plans with an immutable currency and require a matching active account of the selected space when closing a plan into an expense.

#### Scenario: Create a plan
- **WHEN** the user creates a plan
- **THEN** the form requires a supported currency and validates the amount using that currency's precision

#### Scenario: Close a plan
- **WHEN** the user closes an active plan
- **THEN** the form offers only active accounts whose currency matches the plan and sends the selected `accountId`

#### Scenario: No matching account for plan closure
- **WHEN** no active account matches the plan currency
- **THEN** closure is unavailable and account creation is offered only with manageAccounts without changing the plan

### Requirement: Currency-scoped debts
The system SHALL create debts with an immutable currency and apply that currency to every repayment.

#### Scenario: Create a debt
- **WHEN** the user creates a debt
- **THEN** the form requires a supported currency and validates principal precision using that currency, without sending server-owned remainingAmount or status

#### Scenario: Record a non-income repayment
- **WHEN** a repayment is not marked as income
- **THEN** the system submits the repayment without accountId and with isIncome=false

#### Scenario: Record an income-producing repayment
- **WHEN** a repayment is marked as income
- **THEN** the form requires and sends an active account of the same space whose currency matches the debt, with isIncome=true

### Requirement: Financial-operation cache consistency
The system SHALL refresh account-specific and currency-bucket data after every successful operation.

#### Scenario: Account-affecting mutation succeeds
- **WHEN** an income is created or updated, a plan is closed, or an income-producing debt repayment is created
- **THEN** the affected space-scoped account, historical-balance, transaction, report, and owning entity query families are refreshed
