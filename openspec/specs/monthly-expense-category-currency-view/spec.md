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
The widget SHALL keep its selected currency across month changes while that currency has expenses in the new month. Otherwise it SHALL select the first available currency in ascending ISO-code order, without consulting a profile currency.

#### Scenario: Selection remains available
- **WHEN** the user changes months and the previously selected USD has expenses in both months
- **THEN** the widget continues to display USD

#### Scenario: Selection becomes unavailable
- **WHEN** the user changes months and the previously selected currency has no expenses in the new month
- **THEN** the widget displays the first available currency in ascending ISO-code order

#### Scenario: Initial selection
- **WHEN** the widget first receives expenses in multiple currencies
- **THEN** it selects the first available currency in ascending ISO-code order

### Requirement: Currency-scoped category breakdown
The widget SHALL show one row for every category matching its active / archived mode, including zero-expense categories when a currency is available. Amounts and percentages SHALL use only the selected month's currency totals from monthly reports, without loading expense-list pages. The percentage denominator SHALL remain the full currency expense total, including hidden categories.

#### Scenario: Change the displayed currency
- **WHEN** a category has RUB and USD expenses and the user selects USD
- **THEN** its row displays only the USD total formatted as USD
- **THEN** progress uses the total USD expenses for the month as the denominator

#### Scenario: Category has no expenses in selected currency
- **WHEN** a category matching the current mode has no expenses in the selected currency
- **THEN** its row remains visible with a zero amount and zero progress

#### Scenario: Year report includes other months and inactive currencies
- **WHEN** reports contain another month's expenses and a zero-expense currency bucket for the selected month
- **THEN** neither the other month's expenses nor the zero-expense currency appears in the breakdown or choices

#### Scenario: Hidden archived expenses
- **WHEN** active categories total 60 and archived categories total 40 in the selected month and currency
- **THEN** active mode shows only the active categories with percentages based on 100
- **THEN** archive mode shows only archived categories with percentages based on 100
- **THEN** mode switching does not change available currencies

### Requirement: Empty and accessible monthly category view
When the selected month has no expenses, the widget SHALL show an empty state and no selected currency. Currency selection SHALL be accessible and independent of period, other widgets and category controls. Creation SHALL remain available with `manageCategories` in active mode; archive navigation SHALL remain available in both modes.

#### Scenario: Month without expenses
- **WHEN** the current mode has categories but the selected month has no expenses in any currency
- **THEN** the widget displays «Данные отсутствуют» instead of rows or a selected currency
- **THEN** archive navigation remains available and creation is shown only with `manageCategories` in active mode

#### Scenario: Keyboard selection
- **WHEN** a keyboard user selects another offered currency
- **THEN** the control announces the selected currency and updates only this widget's breakdown

#### Scenario: Empty category mode
- **WHEN** categories load successfully and none match the current mode
- **THEN** the widget shows «Архивных категорий нет» in archive mode or «Категорий нет» in active mode
- **THEN** applicable header actions remain available

### Requirement: Descending monthly category order
The monthly widget SHALL order categories matching its mode by selected-month expense totals in the selected currency, highest first. Zero-total categories SHALL follow positive totals, and ties SHALL retain configured list order. Filtering SHALL preserve this ordering in both modes.

#### Scenario: Categories have different totals
- **WHEN** categories in the current mode have totals of 150, 400 and 50
- **THEN** rows appear in the order 400, 150, 50

#### Scenario: Some categories have no expenses
- **WHEN** one matching category has a positive total and two have no expenses
- **THEN** the positive-total category appears first and zero-total categories follow in configured order

#### Scenario: Categories have equal totals
- **WHEN** two matching categories have equal totals
- **THEN** they retain their order from the configured category list

#### Scenario: Selected currency or month changes
- **WHEN** month or currency changes
- **THEN** rows reorder using only the new month's selected-currency totals

### Requirement: Category list mode controls
The widget SHALL default to active categories and toggle to a separate archived-only list. In active mode an archive button SHALL sit immediately left of `+` when creation is permitted. Archive mode SHALL hide `+`, replace the archive icon with a back action and use the title «Архивные категории»; active mode SHALL use «По категориям».

#### Scenario: Enter and leave archive
- **WHEN** the user activates archive or back by mouse or keyboard
- **THEN** the widget switches lists in place without opening a management dialog
- **THEN** month and currency selection remain unchanged and focus stays on the toggle

#### Scenario: Loading and errors
- **WHEN** initial loading, a background refresh or a request error occurs
- **THEN** the selected mode and corresponding controls remain in place
- **THEN** existing loading, error and retry feedback is preserved without displaying the other mode's categories

#### Scenario: Read-only user
- **WHEN** a user lacks `manageCategories`
- **THEN** archive and back remain available while `+` is hidden

### Requirement: Category row details action
The system SHALL provide an accessible category-details action on the name, amount and progress area of each displayed category row, for active and archived categories. Opening or closing details SHALL preserve widget mode, selected month and selected currency.

#### Scenario: Activate row
- **WHEN** the user activates a row by mouse or keyboard
- **THEN** details open for exactly that category with its selected-month amount in the widget currency
- **THEN** no expense-list request is made

#### Scenario: Close archived category details
- **WHEN** archived category details are closed without a successful lifecycle mutation
- **THEN** archive mode remains selected and focus returns to the row
