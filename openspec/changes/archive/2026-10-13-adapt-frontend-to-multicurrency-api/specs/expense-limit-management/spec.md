## ADDED Requirements

### Requirement: Currency-scoped expense limits
The system SHALL manage each expense limit in one immutable ISO currency and SHALL allow the same category and month to have independent limits in different currencies.

#### Scenario: Create a currency limit
- **WHEN** the user creates a limit for the selected month
- **THEN** the temporary row requires a currency and the request includes `currency`, category, total, start date, and end date

#### Scenario: Duplicate category in another currency
- **WHEN** a category already has a limit for the selected month in RUB
- **THEN** the category remains available for a new USD limit

#### Scenario: Duplicate category in the same currency
- **WHEN** a category already has a limit for the selected month in the temporary row's currency
- **THEN** that category is unavailable for the new limit

#### Scenario: Persisted currency is immutable
- **WHEN** an existing limit row is edited
- **THEN** its currency is displayed as read-only and only its total can be submitted

#### Scenario: Currency-specific precision
- **WHEN** a limit total exceeds the selected or persisted currency's supported precision
- **THEN** the row displays a precision error and cannot be saved

