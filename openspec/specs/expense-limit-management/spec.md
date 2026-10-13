# Expense Limit Management

## Purpose

TBD: Define the expected behavior for managing monthly expense limits.

## Requirements

### Requirement: Monthly expense-limit management entry point
The system SHALL provide expense-limit management from the header of the monthly expense-limits widget for the
currently selected dashboard month.

#### Scenario: Entry point in every widget state
- **WHEN** the expense-limits widget is loading, empty, or populated
- **THEN** its header displays a gear action with an accessible management label

#### Scenario: Open management dialog
- **WHEN** the user activates the gear action
- **THEN** the system opens a dialog titled "Лимиты" with an accessible close action

#### Scenario: Selected month context
- **WHEN** the dialog is opened for a dashboard month
- **THEN** it loads limits using a period date within that selected month

### Requirement: Expense-limit list presentation
The system SHALL present the selected month's persisted limits as editable rows in API order and SHALL keep limit
creation available below the list.

#### Scenario: Populated limit list
- **WHEN** persisted limits are loaded
- **THEN** each row displays its category badge, amount field, delete action, and reserved save-action column

#### Scenario: Persisted category is read-only
- **WHEN** a persisted limit row is displayed
- **THEN** its category is presented as a badge and cannot be changed

#### Scenario: Empty limit list
- **WHEN** no limits exist and no temporary row is present
- **THEN** the dialog displays "Пока пусто" above the "Добавить лимит" action

#### Scenario: Long limit list
- **WHEN** limit rows exceed the available dialog height
- **THEN** only the list region scrolls while the title and add action remain available

### Requirement: Independent expense-limit drafts
The system SHALL keep editable limit values in dialog-local row drafts and SHALL persist only the row whose save action
is activated.

#### Scenario: Dirty persisted row
- **WHEN** the user changes a persisted limit amount to a different numeric value
- **THEN** that row displays its save action without shifting the category, amount, or delete columns

#### Scenario: Formatting-equivalent amount
- **WHEN** the user changes only the formatting of a persisted amount to a numerically equivalent value
- **THEN** the row is not considered dirty and its save action remains hidden

#### Scenario: Reverted persisted row
- **WHEN** the user restores a persisted amount to its baseline numeric value
- **THEN** the row is no longer dirty and its save action is hidden while the reserved column remains

#### Scenario: Save one of several dirty rows
- **WHEN** multiple persisted rows are dirty and one valid row is saved successfully
- **THEN** only the saved row receives a new baseline and all other unsaved drafts remain unchanged

#### Scenario: Preserve drafts during refetch
- **WHEN** limit query data refetches while the dialog contains unsaved drafts
- **THEN** the refetch does not replace the dialog's local drafts

#### Scenario: Discard dialog drafts
- **WHEN** the user closes the idle dialog through the close action, backdrop, or Escape key
- **THEN** all unsaved limit changes are discarded without changing query data

### Requirement: Create one expense limit at a time
The system SHALL allow at most one temporary limit row and SHALL keep that row at the bottom before and after
successful creation.

#### Scenario: Add temporary row
- **WHEN** the user activates "Добавить лимит"
- **THEN** one bottom row with an empty category and empty amount appears

#### Scenario: Prevent a second temporary row
- **WHEN** a temporary row exists
- **THEN** "Добавить лимит" remains visible but disabled

#### Scenario: Temporary save action
- **WHEN** a temporary row is present
- **THEN** its save action is visible and remains disabled until both fields are valid

#### Scenario: Remove temporary row
- **WHEN** the user activates delete on a temporary row
- **THEN** the row is removed immediately without confirmation or an API request

#### Scenario: Create limit for selected calendar month
- **WHEN** the user saves a valid temporary row
- **THEN** the create request contains its category identifier, numeric amount, and the first and last calendar dates of
  the selected month

#### Scenario: Create current-month limit
- **WHEN** the selected month is the current month and the user creates a limit before month end
- **THEN** the request still uses the calendar month's final day as its end date

#### Scenario: Create succeeds
- **WHEN** the create request succeeds
- **THEN** the returned persisted limit replaces the temporary row in place and creation becomes available again if an
  unused category remains in the selected currency

#### Scenario: Create fails
- **WHEN** the create request fails
- **THEN** the temporary row and entered values remain available with a row-specific error

### Requirement: One limit per category per month
The system MUST prevent selecting a category that is already represented by another limit in the selected month and selected currency.

#### Scenario: Available category options
- **WHEN** the user opens the category selector in a temporary row
- **THEN** it offers only loaded categories that are not used by another persisted or local limit row in the selected currency

#### Scenario: No unused categories
- **WHEN** every loaded category already has a limit in the selected month and selected currency
- **THEN** "Добавить лимит" is disabled

#### Scenario: Required category
- **WHEN** a temporary row has no category selected
- **THEN** its save action is disabled and a required-field error is available after interaction

#### Scenario: Concurrent duplicate conflict
- **WHEN** the create API rejects the request because the category already has a limit for the period and currency
- **THEN** the system associates the conflict with the category field and preserves the temporary draft

### Requirement: Expense-limit amount validation
The system MUST prevent saving a row unless its amount is a valid positive monetary value with precision supported
by the row's selected or persisted currency.

#### Scenario: Required amount
- **WHEN** a touched amount is empty
- **THEN** the row displays a required-field error and its save action is disabled

#### Scenario: Invalid amount
- **WHEN** an amount cannot be converted to a finite number
- **THEN** the row displays an invalid-amount error and its save action is disabled

#### Scenario: Minimum amount
- **WHEN** an amount is less than `0.01`
- **THEN** the row displays a minimum-amount error and its save action is disabled

#### Scenario: Decimal precision
- **WHEN** an amount exceeds the minor-unit precision of the row's selected or persisted currency
- **THEN** the row displays a precision error and its save action is disabled

#### Scenario: Numeric request amount
- **WHEN** a valid row is submitted
- **THEN** the system sends its amount as a number

### Requirement: Update a persisted expense limit
The system SHALL update only the valid dirty amount of a persisted limit and SHALL preserve its draft when the request
fails.

#### Scenario: Update payload
- **WHEN** the user saves a valid dirty persisted row
- **THEN** the update request contains only the numeric total

#### Scenario: Update succeeds
- **WHEN** an update request succeeds
- **THEN** the returned total becomes that row's baseline and the save action disappears

#### Scenario: Update fails
- **WHEN** an update request fails
- **THEN** the system displays an error for the affected row and preserves its draft for correction or retry

### Requirement: Confirm deletion of persisted expense limits
The system MUST require confirmation before requesting deletion of a persisted limit.

#### Scenario: Request persisted deletion
- **WHEN** the user activates delete on a persisted row
- **THEN** the system opens a confirmation dialog titled "Удалить лимит?" without sending a delete request

#### Scenario: Cancel persisted deletion
- **WHEN** the user cancels the confirmation
- **THEN** no delete request is sent and the limit row remains unchanged

#### Scenario: Confirm persisted deletion
- **WHEN** the user confirms deletion and the request succeeds
- **THEN** the confirmation closes and the limit is removed from the local list

#### Scenario: Deletion failure
- **WHEN** the delete request fails
- **THEN** the confirmation remains open, displays the error, and keeps the limit row

### Requirement: Deterministic pending and loading states
The system SHALL prevent conflicting dialog interactions while limit data or a limit mutation is unresolved.

#### Scenario: Limits loading
- **WHEN** the selected month's limits are loading and no local list is initialized
- **THEN** the dialog displays an accessible loading state

#### Scenario: Categories loading
- **WHEN** categories required for creation are loading
- **THEN** limit creation remains unavailable

#### Scenario: Limit loading failure
- **WHEN** the selected month's limits fail to load
- **THEN** the dialog displays an error and keeps save, add, and delete actions unavailable

#### Scenario: Category loading failure
- **WHEN** categories fail to load after persisted limits are available
- **THEN** the dialog displays a category-loading error and disables creation while keeping persisted amount updates
  and deletion available

#### Scenario: Pending create or update
- **WHEN** a create or update request is pending
- **THEN** management fields and actions are disabled and the main dialog cannot be closed

#### Scenario: Pending deletion
- **WHEN** a delete request is pending
- **THEN** both management and confirmation controls are disabled and neither dialog can be closed

#### Scenario: Generic row mutation failure
- **WHEN** a create or update request fails for a reason not associated with a field
- **THEN** the system shows a generic error for the affected row and preserves its draft

#### Scenario: Clear row mutation error
- **WHEN** the user changes a field associated with a previous row mutation error
- **THEN** that row's associated server error is cleared

### Requirement: Expense-limit cache consistency
The system SHALL refresh monthly expense-limit data after successful persistence without overwriting open unrelated
drafts.

#### Scenario: Refresh monthly widget
- **WHEN** a limit is created, updated, or deleted successfully
- **THEN** expense-limit list query data is invalidated so the monthly progress widget can refresh

#### Scenario: Reconcile only affected draft
- **WHEN** one of several local rows is mutated successfully
- **THEN** only that row is replaced or removed in the dialog-local list

### Requirement: Responsive and accessible limit management
The system SHALL keep limit management usable at narrow viewport widths and expose accessible names and states for all
controls.

#### Scenario: Narrow viewport
- **WHEN** the dialog is displayed at approximately 320 pixels viewport width
- **THEN** each row retains category, amount, delete, and reserved save columns without horizontal clipping

#### Scenario: Icon-only controls
- **WHEN** assistive technology inspects the gear, close, delete, or save control
- **THEN** each control exposes a descriptive accessible label

#### Scenario: Validation and pending state
- **WHEN** a row is invalid or a request is pending
- **THEN** disabled, invalid, error, and busy states are conveyed programmatically as well as visually

#### Scenario: Submit a row from the keyboard
- **WHEN** focus is in a dirty valid amount and the user presses Enter
- **THEN** only that expense-limit row is submitted

### Requirement: Currency-scoped expense limits
The system SHALL manage each expense limit in one immutable ISO currency and SHALL allow the same category and month to have independent limits in different currencies.

#### Scenario: Create a currency limit
- **WHEN** the user creates a limit for the selected month
- **THEN** the temporary row requires a currency and the request includes `currency`, category, total, start date, and end date

#### Scenario: Duplicate category in another currency
- **WHEN** a category already has a limit for the selected month in RUB
- **THEN** the category remains available for a new USD limit

#### Scenario: Duplicate category in the same currency
- **WHEN** a category already has a limit for the selected month in the temporary row's currency
- **THEN** that category is unavailable for the new limit

#### Scenario: Persisted currency is immutable
- **WHEN** an existing limit row is edited
- **THEN** its currency is displayed as read-only and only its total can be submitted

#### Scenario: Currency-specific precision
- **WHEN** a limit total exceeds the selected or persisted currency's supported precision
- **THEN** the row displays a precision error and cannot be saved
