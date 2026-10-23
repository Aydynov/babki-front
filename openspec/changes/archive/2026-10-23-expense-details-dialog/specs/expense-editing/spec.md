# Expense Editing Delta

## MODIFIED Requirements

### Requirement: Current-period expense edit entry point
The system SHALL expose expense editing through the row actions menu and the details dialog only while the selected dashboard period
matches the user's current local calendar month and year.

#### Scenario: Present edit for a current-month expense
- **WHEN** the user opens the actions menu for a loaded expense in the current local calendar month
- **THEN** the menu displays a localized `Редактировать` item with a pencil icon before the delete item

#### Scenario: Keep edit unavailable outside the current month
- **WHEN** the selected dashboard month or year does not match the current local calendar month and year
- **THEN** the expense row exposes no actions menu or edit operation

#### Scenario: Open editing without toggling item details
- **WHEN** the user activates `Редактировать` in an available row menu
- **THEN** the menu closes and the expense dialog opens directly in edit mode without triggering row activation

#### Scenario: Open editing from details
- **WHEN** the user activates `Редактировать` in current-period details with mutation permission and an active account
- **THEN** the same dialog switches to a prefilled edit form for that expense
- **THEN** the read-only edit button has no resting background

#### Scenario: Read-only details when editing is unavailable
- **WHEN** the period is historical, mutation permission is absent or the expense account is archived
- **THEN** read-only details remain available without an edit action

### Requirement: Prefilled expense edit dialog
The system SHALL initialize each edit-dialog session from the selected expense and SHALL make only fields supported by
the expense update contract editable.

#### Scenario: Prefill every expense value
- **WHEN** the edit dialog opens
- **THEN** category, amount, transaction date, merchant, description, and every item name, quantity, and price reflect
  the selected expense

#### Scenario: Keep transaction date immutable
- **WHEN** the edit dialog is open
- **THEN** the transaction date remains visible in a disabled field
- **THEN** no form interaction can change it and the update payload does not contain `transactionDate`

#### Scenario: Discard an idle edit
- **WHEN** the user cancels editing with unsaved changes while no update is pending
- **THEN** the system discards those changes without requesting confirmation and returns to read-only saved details
- **THEN** a separate «Отмена» button is available beside Save

#### Scenario: Escape from editing
- **WHEN** the user presses Escape while editing and no update is pending
- **THEN** the dialog returns to read-only saved details without closing
- **THEN** pressing Escape again closes the dialog

#### Scenario: Close editing with the cross
- **WHEN** the user clicks the close cross while editing and no update is pending
- **THEN** the entire dialog closes and unsaved changes are discarded

#### Scenario: Reopen from current expense data
- **WHEN** the same expense edit dialog is opened again after cancellation, an idle close or a completed update
- **THEN** the form is initialized again from the latest expense object available to the row

### Requirement: Recoverable edit submission
The system SHALL prevent conflicting interactions while an expense update is pending and SHALL keep a failed edit
available for correction or retry.

#### Scenario: Lock a pending update
- **WHEN** the update request is unresolved
- **THEN** save, close, dismissal, fields, item addition, item removal, and quantity controls are disabled
- **THEN** the dialog displays a localized pending state

#### Scenario: Complete a successful update
- **WHEN** the expense update succeeds
- **THEN** the same dialog returns to read-only details using the server-confirmed updated expense and resets its form, amount-mode, and mutation-error state

#### Scenario: Preserve state after update failure
- **WHEN** the expense update fails
- **THEN** the dialog remains open, retains every entered value, and displays a localized retryable error

#### Scenario: Retry a failed update
- **WHEN** the previous update failed and the user submits the retained valid values again
- **THEN** the system sends one new update request for the same expense

#### Scenario: Clear a stale update error
- **WHEN** an update error is displayed and the user changes a form value
- **THEN** the stale general error is removed without discarding other form values

### Requirement: Accessible expense editing
The system MUST expose localized accessible edit controls and predictable keyboard focus behavior.

#### Scenario: Expose an accessible edit name
- **WHEN** assistive technology inspects the expense edit menu item or dialog controls
- **THEN** each control exposes a localized name describing its action

#### Scenario: Operate edit with a keyboard
- **WHEN** a keyboard user opens the row menu and activates the edit item
- **THEN** standard menu and dialog keyboard interactions remain available

#### Scenario: Keep focus inside the dialog on a mode change
- **WHEN** editing succeeds or is cancelled
- **THEN** focus moves to an appropriate control in read-only details without leaving the dialog

#### Scenario: Restore row-action focus
- **WHEN** the expense dialog closes and its originating row or menu trigger remains available
- **THEN** focus returns to the entry point that opened it

#### Scenario: Focus a newly appended edit item
- **WHEN** the user adds the first item or another item in an idle expense edit form
- **THEN** focus moves to the new item name and the field becomes visible for immediate input
- **THEN** later field changes do not return focus to that name field

#### Scenario: Preserve the complete focus indication
- **WHEN** a form control near an edge of the scrollable edit form receives focus
- **THEN** the focus indication remains visible without clipping by that container

### Requirement: Preserve expense account and currency during editing
The system SHALL present an expense's account and currency as immutable context while editing its permitted fields.

#### Scenario: Prefill account context
- **WHEN** the edit dialog opens for a valid expense
- **THEN** it identifies the expense account and currency without offering an account selector

#### Scenario: Map an updated expense
- **WHEN** the user submits valid edits
- **THEN** the update request omits `accountId`, currency, and transaction date

#### Scenario: Archived expense account
- **WHEN** an expense belongs to an archived account
- **THEN** the dialog displays the expense using its stored account and currency context in read-only mode and exposes no edit action

#### Scenario: Validate edited money precision
- **WHEN** an edited amount or item price exceeds the expense currency's supported precision
- **THEN** the form displays a field-level error and does not submit
