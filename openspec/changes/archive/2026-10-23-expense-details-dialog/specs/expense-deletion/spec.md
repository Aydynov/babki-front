# Expense Deletion Delta

## MODIFIED Requirements

### Requirement: Expense row actions menu
The system SHALL provide an actions menu with an icon-only trigger at the right edge of loaded expense rows only when
the selected dashboard period is the user's current local calendar month, without activating the row details dialog.

#### Scenario: Display row action trigger in the current period
- **WHEN** an expense row is rendered while the selected month and year match the current local month and year
- **THEN** the row displays a horizontal-ellipsis button in a dedicated rightmost actions column

#### Scenario: Omit row actions outside the current period
- **WHEN** an expense row is rendered while the selected month or year differs from the current local month or year
- **THEN** the row displays no horizontal-ellipsis button or empty actions menu

#### Scenario: Omit unavailable action loading state
- **WHEN** expenses are loading for a selected period outside the current local month and year
- **THEN** the loading rows display no actions-button skeleton

#### Scenario: Open row actions
- **WHEN** the user activates an available horizontal-ellipsis button in the current period
- **THEN** a popup menu opens for that expense without opening expense details

#### Scenario: Leave the current period during an action
- **WHEN** the selected period changes away from the current local month while an expense action menu, edit mode, or
  confirmation is open
- **THEN** the unavailable action interaction is removed and no update or delete request is sent unless submission
  already started it
- **THEN** any expense dialog that remains open shows read-only saved details

#### Scenario: Present the available operations
- **WHEN** the expense actions menu is open
- **THEN** it contains an edit item represented by a pencil and the visible localized text `Редактировать`
- **THEN** the edit item appears before a delete item represented by a destructive red cross and the visible localized
  text `Удалить`

#### Scenario: Keep the popup visible at table boundaries
- **WHEN** the actions menu opens for a row near an edge of the scrollable table
- **THEN** the popup is positioned outside the table's clipping boundary and remains fully operable

### Requirement: Accessible expense actions
The system MUST expose meaningful localized accessible names and keyboard behavior for the expense actions.

#### Scenario: Accessible action names
- **WHEN** assistive technology inspects the ellipsis trigger, edit item, or delete item
- **THEN** each control exposes a localized accessible name describing its action

#### Scenario: Keyboard menu operation
- **WHEN** a keyboard user focuses and activates the ellipsis trigger
- **THEN** the user can reach and activate edit or delete using standard menu keyboard interaction

#### Scenario: Restore action focus
- **WHEN** the expense dialog opened from the menu is dismissed, or deletion is cancelled, dismissed after failure, or completes successfully while the row remains available
- **THEN** focus returns to the originating ellipsis trigger when that trigger still exists

#### Scenario: Return from editing inside the dialog
- **WHEN** editing succeeds or is cancelled
- **THEN** read-only details appear and focus stays within the expense dialog
