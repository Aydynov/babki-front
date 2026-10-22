# Expense Editing

## Purpose

Define how users edit current-period expenses while preserving validation, update semantics, cache consistency, and
accessible interaction behavior.

## Requirements

### Requirement: Current-period expense edit entry point
The system SHALL expose expense editing through the existing row actions menu only while the selected dashboard period
matches the user's current local calendar month and year.

#### Scenario: Present edit for a current-month expense
- **WHEN** the user opens the actions menu for a loaded expense in the current local calendar month
- **THEN** the menu displays a localized `Редактировать` item with a pencil icon before the delete item

#### Scenario: Keep edit unavailable outside the current month
- **WHEN** the selected dashboard month or year does not match the current local calendar month and year
- **THEN** the expense row exposes no actions menu or edit operation

#### Scenario: Open editing without toggling item details
- **WHEN** the user activates `Редактировать`
- **THEN** the menu closes and the edit dialog opens for that expense
- **THEN** the row's expanded or collapsed item state does not change because of the action

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
- **WHEN** the user closes an edit dialog with unsaved changes while no update is pending
- **THEN** the system discards those changes without requesting confirmation

#### Scenario: Reopen from current expense data
- **WHEN** the same expense edit dialog is opened again after an idle close or completed update
- **THEN** the form is initialized again from the latest expense object available to the row

### Requirement: Edit category availability
The system SHALL offer active expense categories for editing and SHALL also preserve the selected expense's current
archived category as an eligible unchanged value.

#### Scenario: Edit an expense with an active category
- **WHEN** the expense's current category is active and categories load successfully
- **THEN** the category selector offers active categories and selects the current category

#### Scenario: Preserve a current archived category
- **WHEN** the selected expense references an archived category
- **THEN** that archived category remains selected and the form can be saved without changing it
- **THEN** no other archived category is offered

#### Scenario: Replace an archived category
- **WHEN** the user replaces the current archived category
- **THEN** the available replacements contain active categories only

#### Scenario: Categories are loading
- **WHEN** the category request has not completed
- **THEN** the dialog displays a localized loading state and prevents submission

#### Scenario: Category loading fails
- **WHEN** the category request fails and no usable category options are available
- **THEN** the dialog remains open, displays a localized retry action, and prevents submission

#### Scenario: Current category cannot be represented
- **WHEN** neither the expense data nor the loaded category data can represent the expense's current category id
- **THEN** the dialog displays a localized data error and prevents submission

### Requirement: Shared expense form behavior
The system MUST apply the established expense-creation validation and item-list interactions to editable expenses while
preserving the selected expense's initial values.

#### Scenario: Validate editable fields
- **WHEN** the user submits an edit
- **THEN** category is required, amount is positive, merchant is at most 255 characters, and description is at most
  1000 characters
- **THEN** the form requires either a non-whitespace description or at least one fully valid item

#### Scenario: Validate edited items
- **WHEN** any item is present during submission
- **THEN** its name is non-whitespace, quantity is an integer of at least one, and price is positive

#### Scenario: Add, change, and remove items
- **WHEN** the user edits the optional item list while no update is pending
- **THEN** the existing sequential add, quantity increment and decrement, direct entry, validation, and removal
  interactions remain available

#### Scenario: Preserve entered values after validation failure
- **WHEN** submission fails client-side validation
- **THEN** no update request is sent and all current edit values remain available for correction

### Requirement: Existing amount mode initialization
The system SHALL determine whether an existing expense starts in automatic-total or manual-override mode by comparing
its saved amount with the total calculated from its item prices using currency minor-unit precision.

#### Scenario: Initialize automatic mode
- **WHEN** the normalized saved amount equals the sum of the current positive item prices
- **THEN** the form starts in automatic mode and subsequent item changes recalculate the amount

#### Scenario: Initialize manual mode
- **WHEN** the normalized saved amount differs from the sum of the current positive item prices
- **THEN** the form starts in manual-override mode and item changes preserve the saved amount

#### Scenario: Return to automatic mode
- **WHEN** the user clears the amount or enters numeric zero
- **THEN** the form returns to automatic mode and restores the amount calculated from current item prices

#### Scenario: Keep quantity independent from automatic total
- **WHEN** automatic mode is active and an item quantity changes
- **THEN** the amount remains the sum of item prices without multiplying by quantity

### Requirement: Expense update mapping
The system MUST map valid edit values to the existing `UpdateExpenseDto` contract and SHALL explicitly represent
cleared optional content.

#### Scenario: Map a valid edit
- **WHEN** the user submits valid changed or unchanged editable values
- **THEN** the system trims textual identifiers and item names, converts amount, quantities, and prices to numbers, and
  sends category, amount, merchant, description, and items to `PATCH /expenses/:id`
- **THEN** the request does not contain the transaction date

#### Scenario: Clear optional text
- **WHEN** a previously populated merchant or description is cleared and the edit is submitted
- **THEN** the update payload explicitly represents the corresponding empty value so the previous server value is
  removed

#### Scenario: Clear every item
- **WHEN** all previously populated items are removed and the edit is submitted with a valid description
- **THEN** the update payload contains an empty item array so the previous server items are removed

### Requirement: Recoverable edit submission
The system SHALL prevent conflicting interactions while an expense update is pending and SHALL keep a failed edit
available for correction or retry.

#### Scenario: Lock a pending update
- **WHEN** the update request is unresolved
- **THEN** save, close, dismissal, fields, item addition, item removal, and quantity controls are disabled
- **THEN** the dialog displays a localized pending state

#### Scenario: Complete a successful update
- **WHEN** the expense update succeeds
- **THEN** the dialog closes and resets its form, amount-mode, and mutation-error state

#### Scenario: Preserve state after update failure
- **WHEN** the expense update fails
- **THEN** the dialog remains open, retains every entered value, and displays a localized retryable error

#### Scenario: Retry a failed update
- **WHEN** the previous update failed and the user submits the retained valid values again
- **THEN** the system sends one new update request for the same expense

#### Scenario: Clear a stale update error
- **WHEN** an update error is displayed and the user changes a form value
- **THEN** the stale general error is removed without discarding other form values

### Requirement: Update-dependent data consistency
The system SHALL apply a server-confirmed updated expense to cached expense data and begin reconciliation of every
dependent financial query of the original space without reclassifying a successful update as failed.

#### Scenario: Replace the updated expense in cached lists
- **WHEN** the update succeeds and a cached expense list contains the updated id
- **THEN** the system replaces that list item with the expense returned by the server without changing the list total

#### Scenario: Update expense detail cache
- **WHEN** the update succeeds
- **THEN** the matching expense detail cache contains the returned expense

#### Scenario: Refresh dependent query families
- **WHEN** the update succeeds
- **THEN** the system invalidates expense, transaction, report, expense-limit, and balance query families
- **THEN** the system invalidates space account timeline and historical-balance data for the updated expense's account

#### Scenario: Dependent refresh fails after update
- **WHEN** the server confirmed the update but a dependent refresh fails
- **THEN** the system does not reopen the dialog, restore old values, or report the update itself as failed

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
- **THEN** the dialog can still display and edit the expense using its stored account and currency context

#### Scenario: Validate edited money precision
- **WHEN** an edited amount or item price exceeds the expense currency's supported precision
- **THEN** the form displays a field-level error and does not submit
