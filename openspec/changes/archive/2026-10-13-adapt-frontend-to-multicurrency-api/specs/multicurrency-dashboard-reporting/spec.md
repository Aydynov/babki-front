## Purpose

Define currency-safe dashboard reporting that presents every available currency independently and never implies conversion or aggregation.

## ADDED Requirements

### Requirement: Currency-bucket contract validation
The system SHALL validate monthly, yearly, income, and expense summary responses as explicit currency buckets.

#### Scenario: Valid report bucket
- **WHEN** a report period contains currency, income, expense, transfer-in, transfer-out, balance, saving, and category totals
- **THEN** the system accepts and exposes the bucket without deriving a cross-currency total

#### Scenario: Invalid report response
- **WHEN** a successful response omits required currency-bucket fields or contains the legacy single-currency shape
- **THEN** the affected widget enters a localized recoverable error state instead of rendering guessed values

### Requirement: Simultaneous currency presentation
The system SHALL render available currencies as separate sections or series within the existing dashboard and SHALL NOT require an active-currency selector.

#### Scenario: Multiple currencies are available
- **WHEN** a selected period contains RUB and USD buckets
- **THEN** each affected amount, list, or chart presents distinguishable RUB and USD data
- **THEN** no value is labeled as a combined total

#### Scenario: Currency ordering
- **WHEN** multiple currency buckets are displayed
- **THEN** the authenticated user's default currency is shown first and remaining currencies follow in stable ISO-code order

#### Scenario: Currency has no activity
- **WHEN** a known account currency has no income, expense, or transfer activity in the selected period
- **THEN** its bucket remains representable with zero activity and its period-end account values

### Requirement: Currency-explicit money formatting
The system MUST format every financial value using its own ISO currency instead of a locale-derived global currency.

#### Scenario: Format a monetary value
- **WHEN** a widget renders an amount with currency metadata
- **THEN** it uses locale-aware number formatting and the supplied ISO currency's minor units and symbol or code

#### Scenario: Missing currency metadata
- **WHEN** a financial value has no validated currency
- **THEN** the system does not format it using a guessed local currency

### Requirement: Transfer-aware reports
The system SHALL present transfer movements separately from income and expense totals.

#### Scenario: Same-currency transfer in a period
- **WHEN** a transfer occurs between two accounts in one currency
- **THEN** transfer-in and transfer-out values are visible independently and neither changes income or expense totals

#### Scenario: Cross-currency transfer in a period
- **WHEN** a transfer moves value between different currencies
- **THEN** the source amount contributes only to that currency's transfer-out total and the destination amount contributes only to its currency's transfer-in total

### Requirement: Multicurrency empty and error isolation
The system SHALL keep usable currency sections visible when another currency section is empty or fails to load independently.

#### Scenario: One empty currency bucket
- **WHEN** one currency has no list items while another has data
- **THEN** the empty state is scoped to the empty currency without hiding the populated currency

#### Scenario: Shared contract request fails
- **WHEN** a shared report request fails for all currency buckets
- **THEN** the widget displays one accessible retryable error and does not retain values from a previously selected period

