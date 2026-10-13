# Spec Delta

## ADDED Requirements

### Requirement: Descending monthly category order
The monthly expense-category widget SHALL order all configured category rows by their expense totals for the selected month and currency, from highest to lowest. Categories with no expenses in that month and currency SHALL remain visible after categories with positive totals. Rows with equal totals SHALL retain their order from the configured category list.

#### Scenario: Categories have different totals
- **WHEN** the selected month's currency has category totals of 150, 400, and 50
- **THEN** the widget displays those categories in the order 400, 150, 50

#### Scenario: Some categories have no expenses
- **WHEN** one configured category has a positive total and two configured categories have no expenses in the selected month and currency
- **THEN** the positive-total category appears first and both zero-total categories remain visible afterward
- **THEN** the zero-total categories retain their order from the configured category list

#### Scenario: Categories have equal totals
- **WHEN** two categories have equal totals in the selected month and currency
- **THEN** those two rows retain their order from the configured category list

#### Scenario: Selected currency or month changes
- **WHEN** the user selects another available currency or month with different category totals
- **THEN** the widget reorders the rows by that currency's totals for that month without combining amounts from other currencies or months
