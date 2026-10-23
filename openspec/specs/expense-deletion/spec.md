# Expense Deletion

## Purpose

TBD: Define the expected behavior for deleting expenses and refreshing dependent financial data.

## Requirements

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

### Requirement: Confirm expense deletion
The system MUST require explicit confirmation before deleting the transaction represented by an expense row.

#### Scenario: Request deletion
- **WHEN** the user activates the delete menu item labeled "Удалить"
- **THEN** the menu closes and a confirmation titled "Удалить расход?" opens without sending a delete request

#### Scenario: Cancel deletion
- **WHEN** the user cancels an idle confirmation through its cancel action, Escape, or backdrop
- **THEN** no delete request is sent and the expense row remains unchanged

#### Scenario: Confirm deletion
- **WHEN** the user confirms deletion
- **THEN** the system sends one delete request for the underlying transaction identifier

#### Scenario: Pending deletion
- **WHEN** the delete request is unresolved
- **THEN** confirm and cancel controls are disabled, the pending label is displayed, and the confirmation cannot close

#### Scenario: Successful deletion
- **WHEN** the delete request succeeds
- **THEN** the confirmation closes and the deleted expense is removed from every cached expense list that contains it

#### Scenario: Failed deletion
- **WHEN** the delete request fails
- **THEN** the confirmation remains open, the expense row remains unchanged, and a localized retryable error is shown

#### Scenario: Retry failed deletion
- **WHEN** the previous delete request failed and the user confirms again
- **THEN** the system sends one new delete request for the same transaction identifier

### Requirement: Immediate expense-derived cache consistency
The system SHALL update expense-list-derived dashboard views immediately after server-confirmed deletion and SHALL
reconcile them with authoritative server data.

#### Scenario: Remove a cached expense
- **WHEN** deletion succeeds and a cached paginated expense list contains the deleted identifier
- **THEN** the system removes that item and decrements that list's total exactly once

#### Scenario: Preserve unrelated cached lists
- **WHEN** deletion succeeds and a cached expense list does not contain the deleted identifier
- **THEN** the system leaves that list's items and total unchanged

#### Scenario: Update expense-derived widgets
- **WHEN** the deleted item is removed from the expense cache
- **THEN** the expense table, day chart, and category aggregation reflect the new expense data without waiting for a
  server refetch

#### Scenario: Reconcile expense data
- **WHEN** the post-success cache update completes
- **THEN** the system invalidates expense list and detail queries so active expense data refetches from the server

### Requirement: Refresh every deletion-dependent aggregate
The system SHALL begin parallel refresh of all affected space-scoped server-backed financial data affected by a confirmed expense deletion.

#### Scenario: Refresh dependent query families
- **WHEN** the DELETE /spaces/:spaceId/expenses/:id request succeeds
- **THEN** the system invalidates transaction lists, monthly and yearly reports, expense limits, balances, and account
  timeline and historical-balance data for the deleted expense's account

#### Scenario: Reflect refreshed aggregates
- **WHEN** the dependent refetches succeed
- **THEN** expense reports, charts, limit remainders, and balance widgets display values that exclude the deleted expense

#### Scenario: Refresh fails after confirmed deletion
- **WHEN** a dependent query refetch fails after the delete request succeeded
- **THEN** the system does not reopen the confirmation, restore the deleted row, or report the deletion itself as failed
