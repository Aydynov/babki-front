## MODIFIED Requirements

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
