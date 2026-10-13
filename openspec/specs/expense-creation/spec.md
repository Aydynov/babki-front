## Purpose

Define current-period expense creation, itemization, validation, submission recovery, and dependent-data refresh behavior.

## Requirements

### Requirement: Current-period expense creation entry point
The system SHALL provide an icon-only expense-creation trigger in the expense-table widget header only while the
selected dashboard month and year match the user's current local calendar month.

#### Scenario: Show the trigger for a loaded current month
- **WHEN** the expense table displays either populated or empty data for the current local calendar month
- **THEN** the widget header displays a plus trigger for creating an expense

#### Scenario: Preserve the trigger during current-month loading
- **WHEN** the expense table is in its initial loading state for the current local calendar month
- **THEN** the same plus trigger remains available in the widget header

#### Scenario: Hide the trigger outside the current month
- **WHEN** the selected dashboard month or year does not match the user's current local calendar month
- **THEN** the expense-table widget displays no expense-creation trigger

#### Scenario: Expose an accessible trigger name
- **WHEN** assistive technology inspects the expense-creation trigger
- **THEN** the trigger exposes a localized accessible name describing creation of an expense

### Requirement: Expense creation dialog fields and initialization
The system SHALL open an expense-creation dialog containing category, amount, transaction date, merchant, description,
and optional item-list controls, and SHALL initialize every new dialog session deterministically.

#### Scenario: Open a fresh creation dialog
- **WHEN** the user activates the expense-creation trigger
- **THEN** the dialog opens with empty category, amount, merchant, and description values and no item rows
- **THEN** the transaction date contains the user's current local date in a date-input-compatible format

#### Scenario: Change the initialized date
- **WHEN** the dialog is open
- **THEN** the user can replace the default transaction date with another valid date

#### Scenario: Reopen after an idle close
- **WHEN** the user closes an idle dialog with entered values and opens it again
- **THEN** the system starts a fresh session with reset values and a newly evaluated current local date

#### Scenario: Load available categories
- **WHEN** expense categories load successfully and at least one category exists
- **THEN** the category field presents the available categories through the existing category selector

#### Scenario: Categories are loading
- **WHEN** the category request has not completed
- **THEN** the dialog displays a localized loading state and prevents submission

#### Scenario: Category loading fails
- **WHEN** the category request fails
- **THEN** the dialog remains open, displays a localized category-loading error, and prevents submission

#### Scenario: No categories exist
- **WHEN** the category request succeeds with an empty list
- **THEN** the dialog explains that a category must be created first and prevents submission

### Requirement: Sequential item-list management
The system SHALL let users add and remove optional expense items one at a time, with each item containing a required
name, integer quantity of at least one, and positive item price.

#### Scenario: Offer the initial item action
- **WHEN** the dialog contains no item rows
- **THEN** it displays an action labeled "Список"

#### Scenario: Add the first item
- **WHEN** the user activates "Список"
- **THEN** the system appends exactly one item row with an empty name, quantity `1`, and an empty price
- **THEN** the add action label changes to "Добавить ещё"

#### Scenario: Prevent another incomplete row
- **WHEN** the last item has an empty name, non-integer or less-than-one quantity, or non-positive or missing price
- **THEN** the system disables "Добавить ещё"

#### Scenario: Add another valid item
- **WHEN** the last item has a non-whitespace name, integer quantity of at least one, and positive price
- **THEN** activating "Добавить ещё" appends exactly one new item row with quantity `1`

#### Scenario: Increment item quantity
- **WHEN** the user activates an item's increment control
- **THEN** the system increases that item's integer quantity by exactly one

#### Scenario: Decrement item quantity above one
- **WHEN** an item's quantity is greater than one and the user activates its decrement control
- **THEN** the system decreases that item's quantity by exactly one

#### Scenario: Prevent decrement below one
- **WHEN** an item's quantity equals one
- **THEN** its decrement control is disabled and the quantity cannot be reduced below one

#### Scenario: Reject an invalid directly entered quantity
- **WHEN** the user directly enters a fractional quantity or a quantity less than one
- **THEN** the item is invalid and the form cannot be submitted

#### Scenario: Remove an item
- **WHEN** the user activates an item's remove control while no submission is pending
- **THEN** the system removes only that item and retains all other form values

#### Scenario: Remove the last item
- **WHEN** the user removes the only remaining item
- **THEN** no item rows remain and the add action label returns to "Список"

#### Scenario: Expose accessible item controls
- **WHEN** assistive technology inspects an item's increment, decrement, or remove control
- **THEN** each control exposes a localized accessible name identifying its action

### Requirement: Automatic total with manual override
The system SHALL calculate the expense amount as the sum of positive item prices while automatic mode is active,
without using item quantities, and SHALL preserve a user-entered nonzero amount until the user resets the override by
entering zero or clearing the amount.

#### Scenario: Calculate a completed item total
- **WHEN** automatic mode is active and an item has a parseable positive price
- **THEN** the amount includes that price exactly once

#### Scenario: Ignore quantity during automatic calculation
- **WHEN** automatic mode is active and the user changes an item quantity or leaves it empty or invalid
- **THEN** the amount remains the sum of the current positive item prices
- **THEN** quantity validation continues to determine whether the item and form can be submitted

#### Scenario: Recalculate after an item price change
- **WHEN** automatic mode is active and the user changes an item price
- **THEN** the amount becomes the sum of positive prices across the current items

#### Scenario: Recalculate after item addition or removal
- **WHEN** automatic mode is active and the user adds or removes an item
- **THEN** the amount reflects the remaining positive item prices without displaying floating-point artifacts

#### Scenario: Enter a manual amount
- **WHEN** the user enters a nonzero amount
- **THEN** the system enables manual override and preserves the entered amount

#### Scenario: Preserve an overridden amount during item editing
- **WHEN** manual override is active and the user changes, adds, or removes items
- **THEN** the system does not replace the manually entered amount

#### Scenario: Reset the override with zero
- **WHEN** manual override is active and the user enters numeric zero in the amount field
- **THEN** the system disables manual override and restores the amount calculated from the current items

#### Scenario: Reset the override by clearing the amount
- **WHEN** manual override is active and the user clears the amount field
- **THEN** the system disables manual override and restores the amount calculated from the current items

#### Scenario: Enter an amount without items
- **WHEN** the form contains no items
- **THEN** the user can enter a positive amount manually

#### Scenario: Reset without a positive item total
- **WHEN** the user resets manual override but the current items do not produce a positive total
- **THEN** the amount remains invalid until the user enters a positive amount or completes items that produce one

### Requirement: Conditional expense creation validation
The system MUST require a valid category, positive amount, valid transaction date, and either a non-whitespace
description or at least one fully valid item before submission.

#### Scenario: Validate only an edited field before submission
- **WHEN** the user leaves an invalid field configured for blur feedback before attempting to submit the form
- **THEN** the system displays validation feedback only for that field
- **THEN** the system does not display validation feedback for untouched fields

#### Scenario: Open an empty category without validation feedback
- **WHEN** the user opens or leaves the empty category selector before attempting to submit the form
- **THEN** the system does not display the category-required error

#### Scenario: Validate the complete form on submission
- **WHEN** the user attempts to submit the form after receiving field-level validation feedback
- **THEN** the system validates and identifies every invalid form field and conditional content requirement

#### Scenario: Submit with a description and no items
- **WHEN** category, positive amount, and date are valid, description contains non-whitespace text, and no items exist
- **THEN** the form satisfies the content requirement and can be submitted

#### Scenario: Submit with valid items and no description
- **WHEN** category, positive amount, and date are valid, description is empty, and at least one fully valid item exists
- **THEN** the form satisfies the content requirement and can be submitted

#### Scenario: Submit with both content forms
- **WHEN** the form contains both a non-whitespace description and valid items and every other required field is valid
- **THEN** the form can be submitted

#### Scenario: Reject missing expense content
- **WHEN** the description is empty or whitespace-only and no items exist
- **THEN** the form prevents submission and displays a localized error beside the description and item-list area

#### Scenario: Reject invalid present items
- **WHEN** at least one item is present but has an invalid name, quantity, or price
- **THEN** the form prevents submission and identifies the invalid item fields even if a description is present

#### Scenario: Reject a missing category
- **WHEN** no expense category is selected
- **THEN** the form prevents submission and identifies the category field as required

#### Scenario: Reject a non-positive amount
- **WHEN** the amount is empty, invalid, zero, or negative
- **THEN** the form prevents submission and identifies the amount field error

#### Scenario: Reject an invalid date
- **WHEN** the transaction date is empty or cannot be parsed as a valid date
- **THEN** the form prevents submission and identifies the date field error

#### Scenario: Enforce optional text limits
- **WHEN** merchant exceeds 255 characters or description exceeds 1000 characters
- **THEN** the form prevents submission and identifies the corresponding text field error

### Requirement: Expense creation submission and recovery
The system SHALL submit valid form values through the existing expense creation API, prevent duplicate interactions
during the request, and preserve recoverable state when the request fails.

#### Scenario: Map a valid form to the API contract
- **WHEN** the user submits a valid form
- **THEN** the system trims textual values, converts amount, quantities, and prices to numbers, and sends the
  existing `CreateExpenseDto` request shape
- **THEN** blank optional merchant, description, and absent item list values are omitted

#### Scenario: Lock a pending submission
- **WHEN** the create request is unresolved
- **THEN** save, close, dismissal, fields, quantity controls, item addition, and item removal are disabled
- **THEN** the dialog displays a localized pending state

#### Scenario: Complete successful creation
- **WHEN** the create request succeeds
- **THEN** the system closes the dialog and resets its form, item, amount-mode, and mutation-error state

#### Scenario: Preserve state after create failure
- **WHEN** the create request fails
- **THEN** the dialog remains open, every entered field and item is retained, and a localized retryable error is shown

#### Scenario: Retry a failed create
- **WHEN** the previous create request failed and the user submits the still-valid form again
- **THEN** the system sends one new request using the retained values

#### Scenario: Clear a stale request error
- **WHEN** a create error is displayed and the user changes any form field
- **THEN** the stale general request error is removed without discarding other form values

### Requirement: Refresh every creation-dependent query
The system SHALL begin reconciliation of all client data affected by a server-confirmed expense creation without
reclassifying a successful creation as failed when a dependent refresh fails.

#### Scenario: Refresh expense-derived views
- **WHEN** expense creation succeeds
- **THEN** the system invalidates expense queries used by the table, daily chart, and category aggregation
- **THEN** the system invalidates expense-limit and report query families

#### Scenario: Refresh account-derived views
- **WHEN** expense creation succeeds and the response identifies the affected account
- **THEN** the system invalidates balance queries and account-snapshot queries for that account

#### Scenario: Refresh general transactions
- **WHEN** expense creation succeeds
- **THEN** the system invalidates general transaction-list queries

#### Scenario: Dependent refresh fails after creation
- **WHEN** the server has confirmed creation but one or more dependent query refreshes fail
- **THEN** the system does not keep or reopen the dialog, restore submitted values, or report the creation itself as
  failed

### Requirement: Explicit expense account
The system SHALL require an active personal account for expense creation and SHALL derive the expense currency from that account.

#### Scenario: Initialize account selection
- **WHEN** the user opens expense creation and the authenticated user's default account is active
- **THEN** that account is preselected and every active personal account remains available

#### Scenario: Default account is unavailable
- **WHEN** `defaultAccountId` is null, archived, or absent from loaded accounts
- **THEN** the form leaves account selection empty and requires an explicit choice

#### Scenario: Map expense account
- **WHEN** the user submits a valid expense
- **THEN** the create request includes the selected `accountId` and does not send a separate currency

#### Scenario: Validate expense precision
- **WHEN** the amount or an item price exceeds the selected account currency's supported precision
- **THEN** the form displays a field-level error and does not submit

#### Scenario: No active account
- **WHEN** no active personal account exists
- **THEN** expense submission is unavailable and the dialog offers account creation
