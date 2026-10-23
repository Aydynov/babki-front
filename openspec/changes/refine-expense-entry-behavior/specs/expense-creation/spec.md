# Spec Delta

## MODIFIED Requirements

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
- **THEN** focus moves to the new item name and the field is scrolled into view

#### Scenario: Prevent another incomplete row
- **WHEN** the last item has an empty name, non-integer or less-than-one quantity, or non-positive or missing price
- **THEN** the system disables "Добавить ещё"

#### Scenario: Add another valid item
- **WHEN** the last item has a non-whitespace name, integer quantity of at least one, and positive price
- **THEN** activating "Добавить ещё" appends exactly one new item row with quantity `1`
- **THEN** focus moves to the new item name and the field is scrolled into view

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

#### Scenario: Preserve focus during subsequent interaction
- **WHEN** the user enters an item name and moves to quantity, price, or another field
- **THEN** subsequent form updates do not move focus back to the newly added name field

### Requirement: Explicit expense account
The system SHALL require an active balance or saving account of the selected space for expense creation and SHALL derive the expense currency from that account.

#### Scenario: Initialize account selection
- **WHEN** the user opens expense creation
- **THEN** the first active balance account in the loaded account list of the selected space is selected automatically
- **THEN** archived and saving accounts are not selected automatically, and the user can choose another eligible account

#### Scenario: Default account is unavailable
- **WHEN** old local state contains defaultAccountId
- **THEN** it is ignored and no profile default is requested or sent

#### Scenario: Map expense account
- **WHEN** the user submits a valid expense
- **THEN** the create request includes the selected `accountId` and does not send a separate currency

#### Scenario: Validate expense precision
- **WHEN** the amount or an item price exceeds the selected account currency's supported precision
- **THEN** the form displays a field-level error and does not submit

#### Scenario: No active account
- **WHEN** no active balance or saving account of the selected space exists
- **THEN** expense submission is unavailable and the dialog offers account creation only with manageAccounts, otherwise explains the required owner action

#### Scenario: No active checking account but an active saving account exists
- **WHEN** the account list contains no active balance account but contains an active saving account
- **THEN** selection remains empty until the user chooses an eligible active account
- **THEN** the saving account remains available for manual selection

#### Scenario: Keep a manual account choice
- **WHEN** the user changes the preselected account during a creation session
- **THEN** ordinary form updates do not restore the initial account selection

#### Scenario: Reopen expense creation
- **WHEN** the user closes the idle creation form and opens it again
- **THEN** the new form uses the current account list to determine its initial account instead of retaining the discarded choice

## ADDED Requirements

### Requirement: Visible expense form focus
The system SHALL keep focused expense-creation controls perceivable within the scrollable dialog, including their complete focus indication, without removing keyboard navigation or access to other form fields.

#### Scenario: Focus a field at a scroll boundary
- **WHEN** the user focuses a field near an edge of the scrollable form
- **THEN** its focus indication is not clipped by that scroll container

#### Scenario: Reach an appended item
- **WHEN** adding an item places its name outside the currently visible part of the form
- **THEN** the name becomes visible with focus and can immediately accept keyboard input
