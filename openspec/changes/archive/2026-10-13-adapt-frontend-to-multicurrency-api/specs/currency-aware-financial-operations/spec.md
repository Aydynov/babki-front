## Purpose

Define account and currency rules for income, plan, and debt workflows that create or organize personal monetary facts.

## ADDED Requirements

### Requirement: Income account selection
The system SHALL require an active personal account when creating income and SHALL treat the selected account as the income currency source.

#### Scenario: Initialize income creation
- **WHEN** the user opens income creation and a compatible default account is active
- **THEN** that account is preselected while every active balance or saving account remains selectable

#### Scenario: Submit income
- **WHEN** the user submits valid income values
- **THEN** the request contains `accountId` and does not send a separate currency

#### Scenario: No active accounts
- **WHEN** the user has no active account
- **THEN** income submission is unavailable and the form links the user to account creation

### Requirement: Currency-scoped plans
The system SHALL create plans with an immutable currency and require a matching active account when closing a plan into an expense.

#### Scenario: Create a plan
- **WHEN** the user creates a plan
- **THEN** the form requires a supported currency and validates the amount using that currency's precision

#### Scenario: Close a plan
- **WHEN** the user closes an active plan
- **THEN** the form offers only active accounts whose currency matches the plan and sends the selected `accountId`

#### Scenario: No matching account for plan closure
- **WHEN** no active account matches the plan currency
- **THEN** closure is unavailable and account creation is offered without changing the plan

### Requirement: Currency-scoped debts
The system SHALL create debts with an immutable currency and apply that currency to every repayment.

#### Scenario: Create a debt
- **WHEN** the user creates a debt
- **THEN** the form requires a supported currency and validates principal and remaining amounts using that currency's precision

#### Scenario: Record a non-income repayment
- **WHEN** a repayment is not marked as income
- **THEN** the system submits the repayment without requiring an account

#### Scenario: Record an income-producing repayment
- **WHEN** a repayment is marked as income
- **THEN** the form requires and sends an active account whose currency matches the debt

### Requirement: Currency-scoped lists and filters
The system SHALL preserve item currency in plans, debts, incomes, and transactions and support API filters without introducing a global dashboard currency selector.

#### Scenario: Mixed-currency list
- **WHEN** a list contains items in more than one currency
- **THEN** each amount is formatted in its own currency and the items remain distinguishable

#### Scenario: Account-specific transaction request
- **WHEN** a consumer requests transactions for an account
- **THEN** the request uses `accountId` and can include income, expense, and either side of a transfer

### Requirement: Financial-operation cache consistency
The system SHALL refresh account-specific and currency-bucket data after every successful operation.

#### Scenario: Account-affecting mutation succeeds
- **WHEN** an income is created or updated, a plan is closed, or an income-producing debt repayment is created
- **THEN** the affected account, snapshot, transaction, report, and owning entity query families are refreshed

