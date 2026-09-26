# Chart Currency Selection Specification

## Purpose

Let users inspect each dashboard chart in one available currency at a time, without implying that amounts in different currencies have been converted or can be compared on one scale.

## Requirements

### Requirement: Independent currency selection on three charts
The system SHALL provide a currency selector in each of the daily expense, monthly report, and annual expense-category charts. Each selector SHALL control only its own chart.

#### Scenario: Switch one chart
- **WHEN** the user selects USD in the daily expense chart while the monthly report chart shows RUB
- **THEN** the daily expense chart shows only USD data
- **THEN** the monthly report chart remains on RUB

#### Scenario: One available currency
- **WHEN** a chart has data in only one currency
- **THEN** that currency is shown and identified by the selector
- **THEN** the selector cannot switch to an unavailable currency

### Requirement: Offer only currencies with chart data
Each chart's selector SHALL list only currencies with at least one plottable value in that chart's selected period. Daily expenses require at least one expense record; monthly reports require at least one nonzero value among their plotted metrics; annual expense categories require at least one positive category expense total.

#### Scenario: Different chart datasets
- **WHEN** RUB has daily expenses and USD has an annual category expense, but only RUB has monthly plotted metrics
- **THEN** each chart offers only the currencies with data in its own dataset

#### Scenario: No chart data
- **WHEN** no currency has plottable data for a chart in the selected period
- **THEN** the chart shows an empty state in the card
- **THEN** no currency is presented as selected for that chart

### Requirement: Stable selection across period changes
The system SHALL keep each chart's selected currency while it remains available after a period change. When it becomes unavailable, the chart SHALL select the authenticated user's default currency if available, or otherwise the first available currency in ISO-code order.

#### Scenario: Selected currency remains available
- **WHEN** the user changes period and the selected currency has chart data in both periods
- **THEN** that chart continues to show the selected currency

#### Scenario: Selected currency becomes unavailable
- **WHEN** the user changes period and the selected currency has no chart data in the new period
- **THEN** the chart selects the user's default currency if it has data, otherwise the first available currency in ISO-code order

#### Scenario: Initial selection
- **WHEN** a chart first receives data with multiple currencies
- **THEN** it selects the user's default currency if available, otherwise the first available currency in ISO-code order

### Requirement: Currency-scoped chart values
The three charts SHALL render only values denominated in their selected currency, without conversion or cross-currency summation. Their labels, totals, legends, and tooltips SHALL identify and format values in that currency.

#### Scenario: Daily expense chart
- **WHEN** the user selects USD
- **THEN** the daily chart plots only USD expense values against their transaction dates
- **THEN** RUB expenses do not contribute to the plotted values or tooltip

#### Scenario: Monthly report chart
- **WHEN** the user selects a currency
- **THEN** the monthly chart shows its existing expense, income, saving, transfer-in, and transfer-out metrics only for that currency

#### Scenario: Annual expense-category chart
- **WHEN** the user selects a currency
- **THEN** the annual category chart shows only that currency's category slices and total

### Requirement: Accessible chart currency control
Each available chart currency selector SHALL have an accessible currency label and SHALL support keyboard selection without changing the selected period or another chart's currency.

#### Scenario: Keyboard selection
- **WHEN** a keyboard user focuses a chart's currency selector and chooses another offered currency
- **THEN** the selector announces the new currency and only that chart updates
