# Expense Category Management

## Purpose

TBD: Define the expected behavior for managing expense categories.

## Requirements

### Requirement: Category management entry point
The system SHALL replace the monthly widget's gear action with a `+` action labelled «Добавить категорию» that opens a single-category creation dialog. Creation SHALL be available only with `manageCategories` in active mode, including loading, empty and error states.

#### Scenario: Entry point in every widget state
- **WHEN** the active widget is loading, empty, populated or showing a request error
- **THEN** users with `manageCategories` see the accessible `+` creation action

#### Scenario: Open management dialog
- **WHEN** an authorized user activates `+`
- **THEN** the system opens «Добавить категорию» with an empty single-category form and an accessible close action
- **THEN** the former all-category management dialog does not open

#### Scenario: Archive or insufficient permissions
- **WHEN** the widget is in archive mode or the user lacks `manageCategories`
- **THEN** the creation action is hidden

#### Scenario: Annual widget remains unchanged
- **WHEN** the annual expenses-by-categories widget is displayed
- **THEN** this change adds no category management action to that widget

### Requirement: Category draft validation
The system MUST prevent saving unless the trimmed name and selected palette color are valid. An optional description SHALL contain at most 500 characters. Name uniqueness SHALL be checked against all loaded active and archived categories, excluding the category being edited.

#### Scenario: Required name
- **WHEN** a touched category name is empty after trimming
- **THEN** a required-field error is displayed and saving is disabled

#### Scenario: Maximum name length
- **WHEN** a touched category name exceeds 100 characters
- **THEN** a length error is displayed and saving is disabled

#### Scenario: Case-insensitive duplicate
- **WHEN** the draft name matches another category after trimming and case folding
- **THEN** a uniqueness error is displayed and saving is disabled

#### Scenario: Required color
- **WHEN** the draft has no selected palette color
- **THEN** saving is disabled and a color error is available after interaction

#### Scenario: Reused color
- **WHEN** the user chooses a color already used by another category
- **THEN** the color remains valid

#### Scenario: Normalized request name
- **WHEN** a valid draft is submitted
- **THEN** the request name has no leading or trailing whitespace

#### Scenario: Description length
- **WHEN** a touched description exceeds 500 characters
- **THEN** a length error is displayed and saving is disabled

### Requirement: Fixed category color palette
The system SHALL restrict category color selection to a fixed palette of 25 HEX colors displayed as a compact accessible grid. The selected option SHALL have a visible contrasting ring and check indicator when the palette opens and after selection, independently of keyboard focus.

#### Scenario: Open color selector
- **WHEN** the user activates a category's color control
- **THEN** a 5-by-5 grid of 20-by-20-pixel circular color options with 10-pixel gaps is displayed

#### Scenario: Selected color indication
- **WHEN** a palette color is selected and the palette is reopened
- **THEN** exactly that option displays a ring and check indicator in addition to its color
- **THEN** selecting a different option moves both indicators to the new value

#### Scenario: Accessible color selection
- **WHEN** the user navigates the color selector with a keyboard or assistive technology
- **THEN** each color exposes a localized accessible name and the selected state is announced

#### Scenario: Radio-group keyboard navigation
- **WHEN** focus is within the color selector
- **THEN** arrow keys move through the palette using a single radio-group tab stop

#### Scenario: Palette near viewport edge
- **WHEN** the color selector would overflow the viewport
- **THEN** it repositions to remain visible

### Requirement: Update a persisted category
The system SHALL update a valid dirty category from its individual editing form and SHALL preserve the draft when a request fails.

#### Scenario: Update succeeds
- **WHEN** saving succeeds
- **THEN** the category's details show the saved name, color and description

#### Scenario: Duplicate conflict from API
- **WHEN** create or update rejects a duplicate name
- **THEN** the name field displays the conflict and the draft remains available

#### Scenario: Generic save failure
- **WHEN** create or update fails for another reason
- **THEN** the form displays an error and preserves entered values for correction or retry

#### Scenario: Pending save
- **WHEN** create or update is pending
- **THEN** form fields and mutation actions are disabled and the form cannot be closed

### Requirement: Confirm deletion of persisted categories
The system MUST require confirmation before deleting the category selected in its details.

#### Scenario: Request persisted deletion
- **WHEN** the user activates delete in category details
- **THEN** a confirmation opens without sending a delete request, and its description does not include the category name

#### Scenario: Cancel persisted deletion
- **WHEN** the user cancels
- **THEN** no request is sent and the selected category's details remain available

#### Scenario: Confirm persisted deletion
- **WHEN** the user confirms and deletion succeeds
- **THEN** confirmation and category details close and the category disappears from the widget
- **THEN** focus returns to a surviving widget control

#### Scenario: Category is linked to expenses
- **WHEN** deletion is rejected because expenses reference the category
- **THEN** confirmation stays open and explains why deletion is unavailable

#### Scenario: Generic deletion failure
- **WHEN** deletion fails for another reason
- **THEN** confirmation stays open with an error and the category remains available

#### Scenario: Pending deletion
- **WHEN** deletion is pending
- **THEN** confirmation controls are disabled and confirmation cannot be closed

### Requirement: Category cache consistency
The system SHALL refresh category-dependent data after successful creation, editing, archiving, restoration or deletion without overwriting unsaved form drafts.

#### Scenario: Refresh category consumers
- **WHEN** any category mutation succeeds
- **THEN** category lists and details are refreshed in the current budget scope

#### Scenario: Refresh embedded category data
- **WHEN** category name, color, description or archive status changes
- **THEN** dependent expense and expense-limit data can refresh

#### Scenario: Refresh limits after category deletion
- **WHEN** a category is deleted
- **THEN** dependent expense-limit data can refresh

#### Scenario: Preserve open drafts during refetch
- **WHEN** invalidated data refetches during editing
- **THEN** it does not replace the form's unsaved draft

#### Scenario: Preserve monthly progress styling
- **WHEN** a category color changes
- **THEN** monthly widget progress bars retain their existing red styling

### Requirement: Responsive and accessible management controls
The system SHALL keep category details and forms usable at approximately 320 pixels viewport width without horizontal clipping. All icon-only controls SHALL have descriptive accessible labels; disabled, selected, error and pending states SHALL be conveyed programmatically and visually.

#### Scenario: Narrow viewport
- **WHEN** a category dialog opens on a narrow screen with long text
- **THEN** fields and actions remain reachable and content scrolls vertically without clipping

#### Scenario: Icon-only controls
- **WHEN** assistive technology inspects add, archive, back, close, color, delete or save controls
- **THEN** every control has a descriptive accessible label

#### Scenario: Validation and pending state
- **WHEN** a form is invalid or a mutation is pending
- **THEN** error and disabled states are exposed programmatically and visually

#### Scenario: Submit a row from the keyboard
- **WHEN** focus is in a valid dirty name field and the user presses Enter
- **THEN** only that category is submitted

### Requirement: Individual category drafts
The system SHALL keep one category draft local to its creation or editing dialog, separate from persisted query data. Background refetches SHALL preserve an unsaved draft.

#### Scenario: Change and revert
- **WHEN** the user changes and then restores the category fields to their persisted values
- **THEN** the form is no longer dirty and saving an unchanged category is disabled

#### Scenario: Save category
- **WHEN** the user saves a valid draft
- **THEN** only the selected category is created or updated

#### Scenario: Discard dialog draft
- **WHEN** the user closes an idle form through the close action, backdrop or Escape
- **THEN** unsaved changes are discarded without changing persisted category data
- **THEN** during editing Escape returns to details, while the close action and backdrop close the entire dialog

#### Scenario: Preserve draft during refetch
- **WHEN** query data refreshes while a form is dirty
- **THEN** entered values remain unchanged

### Requirement: Single-category creation
The system SHALL create one category from a dialog containing name, palette color and optional description. Cancel SHALL discard the draft without a request. Successful creation SHALL close the form and refresh the active widget list using the existing expense-total ordering.

#### Scenario: Successful creation
- **WHEN** a valid new category is saved successfully
- **THEN** the form closes and the returned category becomes available in active categories

#### Scenario: Cancel creation
- **WHEN** the user cancels the idle creation form
- **THEN** no category is created and focus returns to `+`

### Requirement: Individual category details
The system SHALL open a category's details when its widget row is activated by mouse or keyboard. Details SHALL show name, color, optional description, active / archived status and the selected month's total in the widget currency, without an expense list. Viewing SHALL remain available without `manageCategories`; mutation actions SHALL require that permission.

#### Scenario: Open and close details
- **WHEN** a category row is activated and its details are then closed
- **THEN** the selected category's facts were shown and focus returns to that row
- **THEN** widget mode, month and currency remain unchanged

#### Scenario: No matching expenses
- **WHEN** the category has no expenses in the selected month and currency
- **THEN** details show a zero amount in that currency

#### Scenario: Read-only access
- **WHEN** the user lacks `manageCategories`
- **THEN** details remain available while edit, archive, restore and delete are hidden

### Requirement: Category archive lifecycle
The system SHALL provide archive for an active category and restore for an archived category through its details menu, only with `manageCategories`. Archiving SHALL require confirmation before sending a request; restoration SHALL remain a direct action. Successful mutation SHALL move the category to the opposite widget list, close its details and retain the current widget mode, month and currency.

#### Scenario: Archive or restore succeeds
- **WHEN** the selected category is successfully archived or restored
- **THEN** its status changes and it disappears from the current list
- **THEN** details close and focus moves to the archive / back control

#### Scenario: Archive or restore fails
- **WHEN** a status mutation fails
- **THEN** the category retains its previous status
- **THEN** archive errors appear in the open confirmation and restore errors appear in details

#### Scenario: Pending status change
- **WHEN** archive or restore is pending
- **THEN** conflicting actions and closing are disabled

#### Scenario: Archive confirmation
- **WHEN** the user selects archive from the category menu
- **THEN** a confirmation opens without sending a mutation
- **THEN** cancel keeps the category active, while confirm sends the archive request

### Requirement: Consistent category dialog scrolling
The system SHALL keep the title, close control and form actions reachable while long category content scrolls using the common scrolling dialog presentation. This SHALL apply to details, creation and editing; confirmation dialogs SHALL keep their existing presentation.

#### Scenario: Long content
- **WHEN** category details or a form exceed the viewport height
- **THEN** content scrolls while title, close control and applicable form actions remain reachable

#### Scenario: Confirmation
- **WHEN** a destructive confirmation opens
- **THEN** it uses the existing confirmation presentation rather than the scrolling form layout

### Requirement: Category details presentation and actions
The system SHALL use caption-sized muted labels and body-sized values in an unframed responsive facts grid, consistent with expense details. Management actions SHALL be in a header dropdown like account details, labelled «Редактировать», «Архивировать» or «Восстановить», and «Удалить». Form submission SHALL be labelled «Сохранить».

#### Scenario: Details menu
- **WHEN** an authorized user opens category details
- **THEN** actions are accessible through the header dropdown rather than a row of buttons in the body

#### Scenario: Edit cancellation
- **WHEN** a user activates the arrow button labelled «Отмена» while editing
- **THEN** unsaved changes are discarded and the category details are shown
- **THEN** the close icon still closes the entire dialog
