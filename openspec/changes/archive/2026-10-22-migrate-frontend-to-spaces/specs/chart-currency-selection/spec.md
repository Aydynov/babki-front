## MODIFIED Requirements

### Requirement: Stable selection across period changes
The system SHALL keep each chart's selected currency while it remains available after a period change. When it becomes unavailable, the chart SHALL select the first available currency in ascending ISO-code order, without consulting a profile currency.

#### Scenario: Selected currency remains available
- **WHEN** the user changes period and the selected currency has chart data in both periods
- **THEN** that chart continues to show the selected currency

#### Scenario: Selected currency becomes unavailable
- **WHEN** the user changes period and the selected currency has no chart data in the new period
- **THEN** the chart selects the first available currency in ascending ISO-code order

#### Scenario: Initial selection
- **WHEN** a chart first receives data with multiple currencies
- **THEN** it selects the first available currency in ascending ISO-code order
