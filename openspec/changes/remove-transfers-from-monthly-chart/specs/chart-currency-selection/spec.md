# Spec Delta

## MODIFIED Requirements

### Requirement: Offer only currencies with chart data
Each chart's selector SHALL list only currencies with at least one plottable value in that chart's selected period. Daily expenses require at least one expense record; monthly reports require at least one nonzero expense, income, or saving value, excluding transfer values; annual expense categories require at least one positive category expense total.

#### Scenario: Different chart datasets
- **WHEN** RUB has daily expenses and USD has an annual category expense, but only RUB has monthly plotted metrics
- **THEN** each chart offers only the currencies with data in its own dataset

#### Scenario: No chart data
- **WHEN** no currency has plottable data for a chart in the selected period
- **THEN** the chart shows an empty state in the card
- **THEN** no currency is presented as selected for that chart

#### Scenario: Currency with transfers only
- **WHEN** a currency has nonzero incoming or outgoing transfers but zero expenses, incomes, and savings in every month of the selected period
- **THEN** the monthly chart does not offer that currency

#### Scenario: Any retained metric makes a currency available
- **WHEN** a currency has a nonzero expense, income, or saving value in at least one month, including a negative saving value
- **THEN** the monthly chart offers that currency regardless of its transfer values

#### Scenario: All monthly activity is transfers
- **WHEN** all currencies have only transfers and zero expenses, incomes, and savings in the selected period
- **THEN** the monthly chart shows «Данные отсутствуют» and no selected currency

### Requirement: Currency-scoped chart values
The three charts SHALL render only values denominated in their selected currency, without conversion or cross-currency summation. Their labels, totals, legends, and tooltips SHALL identify and format values in that currency. The monthly chart SHALL display only expenses, incomes, and savings and SHALL exclude incoming and outgoing transfers from bars, legend, and tooltips.

#### Scenario: Daily expense chart
- **WHEN** the user selects USD
- **THEN** the daily chart plots only USD expense values against their transaction dates
- **THEN** RUB expenses do not contribute to the plotted values or tooltip

#### Scenario: Monthly report chart
- **WHEN** the user selects a currency
- **THEN** the monthly chart shows only that currency's expense, income, and saving metrics labeled «Расходы», «Доходы», and «Накопления»
- **THEN** incoming and outgoing transfers do not appear in bars, legend, or tooltips and do not change the plotted values of the three retained metrics

#### Scenario: Annual expense-category chart
- **WHEN** the user selects a currency
- **THEN** the annual category chart shows only that currency's category slices and total
