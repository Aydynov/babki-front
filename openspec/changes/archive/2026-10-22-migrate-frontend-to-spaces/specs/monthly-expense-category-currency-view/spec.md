## MODIFIED Requirements

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

### Requirement: Empty and accessible monthly category view
When the selected month has no expenses, the widget SHALL show an empty state inside its card and SHALL show no selected currency. The currency control SHALL have an accessible label and support keyboard selection without changing the period, other widgets, or access to category management.

#### Scenario: Month without expenses
- **WHEN** the selected month has no expenses in any currency
- **THEN** the widget shows an empty state instead of category rows or a selected currency
- **THEN** the category-management control remains available only with manageCategories

#### Scenario: Keyboard selection
- **WHEN** a keyboard user selects another offered currency in the widget
- **THEN** the control announces the selected currency and updates only the monthly category breakdown
