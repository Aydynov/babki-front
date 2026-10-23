# Spec Delta

## MODIFIED Requirements

### Requirement: Edit category availability
The system SHALL offer active expense categories for editing and SHALL also preserve the selected expense's current
archived category as an eligible unchanged value.

#### Scenario: Edit an expense with an active category
- **WHEN** the expense's current category is active and categories load successfully
- **THEN** the category selector offers active categories and selects the current category

#### Scenario: Preserve a current archived category
- **WHEN** the selected expense references an archived category
- **THEN** that archived category remains selected and the form can be saved without changing it
- **THEN** the dropdown offers active categories only and does not contain the selected archived category as a selectable item

#### Scenario: Replace an archived category
- **WHEN** the user replaces the current archived category
- **THEN** the available replacements contain active categories only
- **THEN** the previous archived category cannot be selected again from the dropdown during that session

#### Scenario: Categories are loading
- **WHEN** the category request has not completed
- **THEN** the dialog displays a localized loading state and prevents submission

#### Scenario: Category loading fails
- **WHEN** the category request fails and no usable category options are available
- **THEN** the dialog remains open, displays a localized retry action, and prevents submission

#### Scenario: Current category cannot be represented
- **WHEN** neither the expense data nor the loaded category data can represent the expense's current category id
- **THEN** the dialog displays a localized data error and prevents submission

### Requirement: Accessible expense editing
The system MUST expose localized accessible edit controls and predictable keyboard focus behavior.

#### Scenario: Expose an accessible edit name
- **WHEN** assistive technology inspects the expense edit menu item or dialog controls
- **THEN** each control exposes a localized name describing its action

#### Scenario: Operate edit with a keyboard
- **WHEN** a keyboard user opens the row menu and activates the edit item
- **THEN** standard menu and dialog keyboard interactions remain available

#### Scenario: Restore row-action focus
- **WHEN** editing is closed or succeeds while the originating expense row remains available
- **THEN** focus returns to that row's ellipsis trigger

#### Scenario: Focus a newly appended edit item
- **WHEN** the user adds the first item or another item in an idle expense edit form
- **THEN** focus moves to the new item name and the field becomes visible for immediate input
- **THEN** later field changes do not return focus to that name field

#### Scenario: Preserve the complete focus indication
- **WHEN** a form control near an edge of the scrollable edit form receives focus
- **THEN** the focus indication remains visible without clipping by that container
