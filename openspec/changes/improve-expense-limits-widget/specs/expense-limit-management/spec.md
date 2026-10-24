# Spec Delta

## MODIFIED Requirements

### Requirement: Monthly expense-limit management entry point
The system SHALL provide expense-limit management from the header of the monthly expense-limits widget for the
currently selected dashboard month and widget currency, for users with `manageLimits`. The gear action SHALL remain available in loading, empty and error states; without an available account currency it SHALL be disabled.

#### Scenario: Entry point in every widget state
- **WHEN** the expense-limits widget is loading, empty, or populated
- **THEN** its header displays a gear action with an accessible management label, with availability governed by permission and account currency

#### Scenario: Open management dialog
- **WHEN** the user activates the gear action
- **THEN** the system opens the common dialog titled "Лимиты" for that currency, with an accessible close action

#### Scenario: Selected month context
- **WHEN** the dialog is opened for a dashboard month
- **THEN** it loads limits using a period date within that selected month

### Requirement: Expense-limit list presentation
The system SHALL present the selected month's persisted limits in the widget's selected currency as editable rows in API order and SHALL keep limit
creation available below the list.

#### Scenario: Populated limit list
- **WHEN** persisted limits are loaded
- **THEN** each row displays its category badge, reserved save-action column to the left of the amount field, and a trailing delete or restore action, without a currency field or repeated currency text

#### Scenario: Persisted category is read-only
- **WHEN** a persisted limit row is displayed
- **THEN** its category is presented as a badge and cannot be changed

#### Scenario: Empty limit list
- **WHEN** no limits exist and no temporary row is present
- **THEN** the dialog displays "Пока пусто" above the "Добавить лимит" action

#### Scenario: Long limit list
- **WHEN** limit rows exceed the available dialog height
- **THEN** the dialog content scrolls vertically while the title and close control remain available; the add action follows the list and remains reachable

#### Scenario: Minimal add action
- **WHEN** the common dialog is displayed
- **THEN** «Добавить лимит» is a compact plus-and-text action aligned to the left below the rows, without a permanent background or outline
- **THEN** layout and typography match the expense item-list editor rather than a full-width call-to-action


### Requirement: Create one expense limit at a time
The system SHALL allow at most one temporary limit row and SHALL keep that row at the bottom before and after
successful creation.

#### Scenario: Add temporary row
- **WHEN** the user activates "Добавить лимит"
- **THEN** one bottom row with an empty category and empty amount appears, inheriting the dialog currency without a currency control

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
- **THEN** the create request contains its category identifier, numeric amount, inherited currency, and the first and last calendar dates of
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
- **THEN** it offers only active loaded categories that are not used by another persisted or local limit row in the dialog currency

#### Scenario: No unused categories
- **WHEN** every selectable active category already has a limit in the selected month and selected currency
- **THEN** "Добавить лимит" is disabled

#### Scenario: Required category
- **WHEN** a temporary row has no category selected
- **THEN** its save action is disabled and a required-field error is available after interaction

#### Scenario: Concurrent duplicate conflict
- **WHEN** the create API rejects the request because the category already has a limit for the period and currency
- **THEN** the system associates the conflict with the category field and preserves the temporary draft

### Requirement: Confirm deletion of persisted expense limits
The system MUST require confirmation before requesting deletion of a persisted limit from either a management row or its details menu. The confirmation description SHALL omit the category name.

#### Scenario: Request persisted deletion
- **WHEN** the user activates delete on a persisted row or in its details menu
- **THEN** the system opens a confirmation dialog titled "Удалить лимит?" without sending a delete request

#### Scenario: Cancel persisted deletion
- **WHEN** the user cancels the confirmation
- **THEN** no delete request is sent and the limit row remains unchanged

#### Scenario: Confirm persisted deletion
- **WHEN** the user confirms deletion and the request succeeds
- **THEN** the confirmation closes and the limit is removed from the local list; if that limit’s details were open, they close and focus returns to a surviving widget control

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

#### Scenario: Account currencies loading or unavailable
- **WHEN** account data has not loaded successfully
- **THEN** the widget keeps its header and loading or retry feedback, does not invent currency choices, and prevents creation without a confirmed currency

#### Scenario: Cached data during refresh failure
- **WHEN** an account or limit refresh fails after usable data has already loaded
- **THEN** usable data and its currency context remain visible with local error and retry feedback


### Requirement: Expense-limit cache consistency
The system SHALL refresh monthly expense-limit data after successful persistence without overwriting open unrelated
drafts.

#### Scenario: Refresh monthly widget
- **WHEN** a limit is created, updated, or deleted successfully
- **THEN** the saved response or successful deletion is reflected in relevant cached lists and details for that budget, and dependent data is invalidated so the widget and summary can refresh

#### Scenario: Reconcile only affected draft
- **WHEN** one of several local rows is mutated successfully
- **THEN** only that row is replaced or removed in the dialog-local list

#### Scenario: Successful write followed by refresh failure
- **WHEN** a write succeeds but a subsequent list refresh fails
- **THEN** the saved amount or confirmed deletion remains reflected in the widget and details, while the management summary continues to use its current field values
- **THEN** unrelated row drafts and other budget caches remain unchanged


### Requirement: Responsive and accessible limit management
The system SHALL keep limit management usable at narrow viewport widths and expose accessible names and states for all
controls.

#### Scenario: Narrow viewport
- **WHEN** the dialog is displayed at approximately 320 pixels viewport width
- **THEN** each row retains category, save, amount, and trailing action columns without horizontal clipping

#### Scenario: Icon-only controls
- **WHEN** assistive technology inspects the gear, details-menu trigger, close, delete, or save control
- **THEN** each control exposes a descriptive accessible label

#### Scenario: Validation and pending state
- **WHEN** a row is invalid or a request is pending
- **THEN** disabled, invalid, error, and busy states are conveyed programmatically as well as visually

#### Scenario: Submit a row from the keyboard
- **WHEN** focus is in a dirty valid amount and the user presses Enter
- **THEN** only that expense-limit row is submitted

#### Scenario: Concise labels and placeholders
- **WHEN** limit details and management controls are presented
- **THEN** textual actions use «Редактировать», «Удалить» and «Сохранить», and empty category / amount controls have descriptive placeholders
- **THEN** details use muted caption labels and body-sized values in an unframed responsive facts grid consistent with expense details


### Requirement: Currency-scoped expense limits
The system SHALL manage each expense limit in one immutable ISO currency and SHALL allow the same category and month to have independent limits in different currencies.

#### Scenario: Create a currency limit
- **WHEN** the user creates a limit for the selected month
- **THEN** the temporary row inherits the widget currency and the request includes `currency`, category, total, start date, and end date

#### Scenario: Duplicate category in another currency
- **WHEN** a category already has a limit for the selected month in RUB
- **THEN** the category remains available for a new USD limit

#### Scenario: Duplicate category in the same currency
- **WHEN** a category already has a limit for the selected month in the temporary row's currency
- **THEN** that category is unavailable for the new limit

#### Scenario: Persisted currency is immutable
- **WHEN** an existing limit row is edited
- **THEN** its currency is inherited from dialog context without a repeated currency value or field in the row, and only its total can be submitted

#### Scenario: Currency-specific precision
- **WHEN** a limit total exceeds the selected or persisted currency's supported precision
- **THEN** the row displays a precision error and cannot be saved

## ADDED Requirements

### Requirement: Account-backed currency selection for expense limits
The widget SHALL offer unique currencies of existing accounts in the current budget, including balance, saving and archived accounts. It SHALL preserve its selected currency across month changes while available, otherwise select the first available ISO code in ascending order. It SHALL display only matching-currency limits in API order and never convert or combine currencies.

#### Scenario: Currency has accounts but no limits
- **WHEN** accounts exist in USD but the selected month has no USD limits
- **THEN** USD remains selectable, the widget shows an empty state and authorized users can open common management to create a first USD limit

#### Scenario: Different currencies
- **WHEN** RUB and USD limits exist and the user chooses USD
- **THEN** the widget and subsequently opened management show only USD limits
- **THEN** the selected month and other widgets do not change

#### Scenario: No accounts
- **WHEN** accounts load successfully and no account currencies exist
- **THEN** no currency is selected, creation is unavailable, and the widget explains that an account is required

#### Scenario: Single currency
- **WHEN** exactly one account currency is available
- **THEN** the selector shows that currency and cannot switch to another

#### Scenario: Account currency disappears
- **WHEN** the last account of the selected currency is removed
- **THEN** the widget selects the first remaining currency or no currency if none remain
- **THEN** an open dialog bound to the previous currency closes without saving drafts

### Requirement: Current-currency limit summary
The common dialog SHALL show «Общая сумма лимитов» above its rows, equal to the sum of current amount field values for its selected month and currency, including unsaved edits and temporary rows. Empty or non-finite values SHALL contribute zero. The summary SHALL include currency formatting and SHALL show zero when the initialized form has no rows.

#### Scenario: Edit an amount
- **WHEN** the user changes an amount without saving
- **THEN** the summary immediately reflects the entered value without including limits from other currencies

#### Scenario: Temporary or incomplete row
- **WHEN** a temporary row has a numeric amount, even without a selected category
- **THEN** its amount contributes to the summary before saving
- **THEN** clearing the field or entering a non-finite value contributes zero without producing an invalid number

#### Scenario: Remove a row
- **WHEN** a temporary row is removed or a persisted row is deleted successfully
- **THEN** its current amount no longer contributes to the summary


### Requirement: Individual limit details and common editing
Activating a widget row by mouse or keyboard SHALL open details with category, currency, period, remainder, total and spent amount, without an expense list. Viewing SHALL be available without `manageLimits`; a header menu with «Редактировать» and «Удалить» SHALL require that permission. Editing SHALL open the same common management view and focus the selected row’s amount.

#### Scenario: Open and close details
- **WHEN** a user opens a row and then closes its details
- **THEN** facts describe that limit, spent equals total minus remainder, and focus returns to its row
- **THEN** month and currency remain unchanged and no expense-list request is made

#### Scenario: Edit from details
- **WHEN** the user chooses «Редактировать» in details
- **THEN** the common dialog shows all limits of that month and currency and focuses the selected row amount
- **THEN** saving a row keeps the common manager available for editing other rows

#### Scenario: Read-only access
- **WHEN** the user lacks `manageLimits`
- **THEN** details remain available while management entry and mutation menu actions are hidden

### Requirement: Consistent limit dialog navigation
Details and common management SHALL use the shared scrolling-dialog presentation; deletion SHALL use the existing confirmation presentation. When management is entered from details, Escape SHALL discard unsaved drafts and return to details. The common manager SHALL have no bottom cancel-arrow action. The close icon or backdrop SHALL close the whole dialog. Pending mutations SHALL prevent closing or cancellation.

#### Scenario: Cancel common editing from details
- **WHEN** the user presses Escape after entering management from details
- **THEN** all unsaved row drafts are discarded and the originating limit details reappear with focus at the actions menu

#### Scenario: Management opened from header
- **WHEN** management was opened from the gear and the user closes or cancels it
- **THEN** unsaved drafts are discarded and focus returns to the gear

#### Scenario: Context change or missing origin
- **WHEN** budget or month changes, or the originating limit disappears
- **THEN** stale dialogs close without submitting drafts or mutating another budget
- **THEN** focus falls back to a surviving widget control when the old row is unavailable

### Requirement: Restore an edited limit amount
A persisted row with an edited amount SHALL replace its trailing delete action with an accessible restore action. Activating restore SHALL reset only that row amount to its latest successfully saved value, clear its associated mutation error, and immediately update the form summary without an API request. The save action SHALL be placed immediately to the left of the amount field.

#### Scenario: Restore an edited persisted row
- **WHEN** a user changes a persisted amount and activates restore
- **THEN** its saved amount reappears, its save action disappears and delete is available again
- **THEN** other drafts remain unchanged and no persistence request is sent

#### Scenario: Restore after saving a new amount
- **WHEN** an amount is saved successfully and edited again
- **THEN** restore returns to the latest successful amount

#### Scenario: Temporary row
- **WHEN** a new row has no saved amount
- **THEN** its trailing action remains delete and its save action appears to the left of the amount

#### Scenario: Pending mutation
- **WHEN** a mutation is pending
- **THEN** restore is disabled with the other form actions
