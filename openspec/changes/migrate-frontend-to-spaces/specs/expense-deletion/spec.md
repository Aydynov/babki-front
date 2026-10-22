## MODIFIED Requirements

### Requirement: Refresh every deletion-dependent aggregate
The system SHALL begin parallel refresh of all affected space-scoped server-backed financial data affected by a confirmed expense deletion.

#### Scenario: Refresh dependent query families
- **WHEN** the DELETE /spaces/:spaceId/expenses/:id request succeeds
- **THEN** the system invalidates transaction lists, monthly and yearly reports, expense limits, balances, and account
  timeline and historical-balance data for the deleted expense's account

#### Scenario: Reflect refreshed aggregates
- **WHEN** the dependent refetches succeed
- **THEN** expense reports, charts, limit remainders, and balance widgets display values that exclude the deleted expense

#### Scenario: Refresh fails after confirmed deletion
- **WHEN** a dependent query refetch fails after the delete request succeeded
- **THEN** the system does not reopen the confirmation, restore the deleted row, or report the deletion itself as failed
