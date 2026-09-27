# Monthly Expense Category Currency View Specification

## Purpose

Let users inspect the selected month's expense categories in one available currency at a time, keeping the card compact without combining amounts from different currencies.

## Requirements

### Requirement: Monthly category currency selection
The monthly expense-category widget SHALL display one selected currency at a time and SHALL offer only currencies that have at least one expense in the selected month. The selector SHALL identify the displayed currency in the card header.

#### Scenario: Multiple expense currencies
- **WHEN** the selected month contains expenses in RUB and USD
- **THEN** the widget offers RUB and USD and displays one currency's category breakdown at a time
- **THEN** choosing USD changes only this widget's displayed currency

#### Scenario: One expense currency
- **WHEN** the selected month contains expenses only in RUB
- **THEN** the widget identifies RUB as its displayed currency
- **THEN** the selector cannot switch to a currency without expenses in that month

### Requirement: Stable monthly category currency selection
The widget SHALL keep its selected currency across month changes while that currency has expenses in the new month. Otherwise it SHALL select the authenticated user's default currency if available, or the first available currency in ISO-code order.

#### Scenario: Selection remains available
- **WHEN** the user changes months and the previously selected USD has expenses in both months
- **THEN** the widget continues to display USD

#### Scenario: Selection becomes unavailable
- **WHEN** the user changes months and the previously selected currency has no expenses in the new month
- **THEN** the widget displays the user's default currency if it has expenses, or otherwise the first available currency in ISO-code order

#### Scenario: Initial selection
- **WHEN** the widget first receives expenses in multiple currencies
- **THEN** it selects the user's default currency if available, or otherwise the first available currency in ISO-code order

### Requirement: Currency-scoped category breakdown
The widget SHALL show one row for every configured expense category, including categories with zero expenses, and SHALL calculate each amount and progress percentage solely from expenses in the selected month and currency. It MUST NOT sum or compare amounts across currencies.

The widget SHALL use the monthly reports API's selected-month category totals and currency expense total. It SHALL NOT load individual expense-list pages to construct this breakdown.

#### Scenario: Change the displayed currency
- **WHEN** a category has RUB and USD expenses and the user selects USD
- **THEN** its row displays only the USD total formatted as USD
- **THEN** its progress percentage uses the total USD expenses for the month as the denominator

#### Scenario: Category has no expenses in selected currency
- **WHEN** a configured category has no expenses in the selected currency
- **THEN** its row remains visible with a zero amount and zero progress

#### Scenario: Year report includes other months and inactive currencies
- **WHEN** a monthly reports response contains expenses in another month and a zero-expense currency bucket in the selected month
- **THEN** neither the other month's expenses nor the zero-expense currency appears in the selected month's breakdown or currency choices

### Requirement: Empty and accessible monthly category view
When the selected month has no expenses, the widget SHALL show an empty state inside its card and SHALL show no selected currency. The currency control SHALL have an accessible label and support keyboard selection without changing the period, other widgets, or access to category management.

#### Scenario: Month without expenses
- **WHEN** the selected month has no expenses in any currency
- **THEN** the widget shows an empty state instead of category rows or a selected currency
- **THEN** the category-management control remains available

#### Scenario: Keyboard selection
- **WHEN** a keyboard user selects another offered currency in the widget
- **THEN** the control announces the selected currency and updates only the monthly category breakdown
