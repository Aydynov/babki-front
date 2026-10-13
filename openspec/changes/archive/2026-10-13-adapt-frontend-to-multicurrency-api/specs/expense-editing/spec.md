## ADDED Requirements

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

