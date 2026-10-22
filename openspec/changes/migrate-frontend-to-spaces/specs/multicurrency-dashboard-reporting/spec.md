## MODIFIED Requirements

### Requirement: Simultaneous currency presentation
The system SHALL render available currencies as separate sections or series within the existing dashboard and SHALL NOT require an active-currency selector.

#### Scenario: Multiple currencies are available
- **WHEN** a selected period contains RUB and USD buckets
- **THEN** each affected amount, list, or chart presents distinguishable RUB and USD data
- **THEN** no value is labeled as a combined total

#### Scenario: Currency ordering
- **WHEN** multiple currency buckets are displayed
- **THEN** currencies follow stable ascending ISO-code order without a profile currency

#### Scenario: Currency has no activity
- **WHEN** a known account currency has no income, expense, or transfer activity in the selected period
- **THEN** its bucket remains representable with zero activity and its period-end account values

## ADDED Requirements

### Requirement: Explicit historical space reports
The system SHALL send explicit UTC dates for selected historical months and years and preserve complete annual history using bounded report requests. Monthly and annual periods SHALL use YYYY-MM and YYYY. Empty currencies SHALL remain empty without a guessed profile currency.

#### Scenario: Historical income comparison
- **WHEN** January is compared with the previous December
- **THEN** both report requests have explicit dates, including the previous UTC year

#### Scenario: Annual history
- **WHEN** earlier years are required
- **THEN** the earliest relevant account opening date determines the explicit starting year, including archived accounts
- **THEN** ranges respect the backend maximum of 100 years and are joined without missing or duplicate periods

#### Scenario: Empty space
- **WHEN** report periods contain currencies=[] and there are no accounts
- **THEN** widgets show empty states without a synthetic RUB or profile-currency bucket

#### Scenario: No income revenue endpoint
- **WHEN** monthly income totals are loaded
- **THEN** they come from income currency buckets in /spaces/:spaceId/reports/months, never from an incomes/revenue endpoint
