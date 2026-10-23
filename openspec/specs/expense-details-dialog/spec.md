# expense-details-dialog Specification

## Purpose

Предоставлять безопасный просмотр полного расхода и его позиций из таблицы с переходом к разрешённому редактированию.

## Requirements

### Requirement: Open expense details from a row
The system SHALL open a read-only expense dialog when a loaded expense row is activated, including past periods and records the user cannot edit.

#### Scenario: Activate a row
- **WHEN** the user clicks a non-interactive area of an expense row
- **THEN** details of that expense open without changing data

#### Scenario: View a historical or restricted expense
- **WHEN** the user opens a past-period expense or one without mutation permission or with an archived account
- **THEN** its details remain readable and the edit action is unavailable

#### Scenario: Separate interactive row controls
- **WHEN** the user activates the row menu or category retry control
- **THEN** only that control's action runs and the details dialog does not open

### Requirement: Readable complete expense information
The system SHALL show the expense's category, amount and currency, date, account, participant, merchant, description and item names, quantities and prices as labelled read-only content in the style of debt details, with author information when available.

#### Scenario: Read populated details
- **WHEN** an expense with items and optional text is opened
- **THEN** all saved values are visible without editable or disabled form controls
- **THEN** item prices use the expense currency and the saved total is not recalculated
- **THEN** items share one bordered container with separators between rows, in the style of debt history

#### Scenario: Missing optional values
- **WHEN** merchant or description is absent
- **THEN** explicit neutral placeholders are shown

#### Scenario: No expense items
- **WHEN** the expense has no items
- **THEN** the items section, including its heading, is not rendered

#### Scenario: Unavailable reference metadata
- **WHEN** an account, participant or category label cannot be resolved
- **THEN** the expense remains readable with stored context or a neutral label and any available retry action
- **THEN** no unrelated account, category or participant is substituted

### Requirement: Expense items live in the dialog
The system SHALL present positions inside expense details and SHALL remove inline item expansion from the expense table.

#### Scenario: Render expenses with items
- **WHEN** an expense with positions appears in the table
- **THEN** the row has no nested positions table or «Развернуть»/«Свернуть» control
- **THEN** activating the row gives access to every saved position in the dialog

### Requirement: Accessible responsive expense details
The system MUST support keyboard activation, modal focus management and readable details on mobile and desktop.

#### Scenario: Keyboard entry and dismissal
- **WHEN** a keyboard user focuses and activates a row's details entry point
- **THEN** the labelled dialog opens and receives focus
- **THEN** Escape or the close control dismisses idle details and restores focus to the originating entry point if it remains

#### Scenario: Long content on a narrow screen
- **WHEN** details contain long text or many items on a mobile viewport
- **THEN** content wraps or scrolls within the viewport and all items and actions remain reachable

#### Scenario: Close and reopen
- **WHEN** the user closes details and opens any expense again
- **THEN** it starts in read-only mode with that expense's latest available saved data
