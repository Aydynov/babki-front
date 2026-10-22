## Purpose

Define the frontend boundary for space-owned financial data, preserving actor privacy and rejecting obsolete contracts before they reach the financial UI.

## ADDED Requirements

### Requirement: Space financial ownership
The system MUST validate financial responses with `spaceId` and financial `_id`, separately from human authorship. Financial create and patch requests SHALL derive ownership from the URL and omit server-owned identity fields.

#### Scenario: Validate current ownership
- **WHEN** an account, operation, category, limit, plan or debt is returned with space ownership
- **THEN** it is accepted without requiring legacy ownerType, ownerId or ownership userId
- **THEN** space DTOs use id, while actor.userId, member.userId and space.ownerId remain human references

#### Scenario: Submit financial changes
- **WHEN** a financial create or patch request is sent
- **THEN** its body contains only the endpoint's allowed fields and omits spaceId, ownerType, ownerId, userId, createdBy and actor objects

### Requirement: Current collection and empty-body contracts
The system SHALL validate each collection's actual envelope and SHALL accept successful 204 responses without JSON parsing. Pagination SHALL use total and retain access to all pages, with limit at most 100.

#### Scenario: Collection shapes
- **WHEN** collections load
- **THEN** spaces, members, invitations, operations, transfers, plans, debts and repayments use items/total/page/limit
- **THEN** accounts, categories and limits are arrays, and reports are period/currencies arrays

#### Scenario: Include archived records
- **WHEN** the user includes archived plans or debts
- **THEN** the query serializes includeArchived as true or false text rather than 1 or 0

#### Scenario: Archive succeeds
- **WHEN** an archive or removal endpoint returns 204
- **THEN** the action succeeds without requiring a response body

### Requirement: Server actor privacy
The system MUST render returned actor objects as the authoritative source of author names, including authors, expense participants and repayment cancellation authors. An anonymized actor SHALL never recover a name from cached profiles or memberships.

#### Scenario: Anonymized actor
- **WHEN** an actor has isAnonymized=true and null names
- **THEN** the UI shows «Удалённый пользователь» while retaining the actor's userId and financial history

#### Scenario: Former member
- **WHEN** a historical participant has left the space without account deletion
- **THEN** their returned actor remains readable even when absent from current member pages

### Requirement: Status-based financial failures
The system SHALL distinguish validation, authorization, availability, conflict and service failures by HTTP/statusCode. Both string and string-array messages SHALL be supported. Only an active-session 401 SHALL invoke session expiration.

#### Scenario: Validation or conflict
- **WHEN** a mutation returns 400 or 409
- **THEN** entered values remain available and the UI reports the failure without claiming success or automatically repeating the mutation

#### Scenario: Rights or object availability changes
- **WHEN** a request returns 403 or 404
- **THEN** current space access and permissions are rechecked before changing the selection
- **THEN** an inaccessible record alone does not imply that the entire space is inaccessible

#### Scenario: Service failure
- **WHEN** a financial mutation returns 503
- **THEN** no successful financial effect is applied and an explicit retry remains available

### Requirement: Archived reference preservation
The system SHALL retain archived accounts and categories when resolving history while excluding them from new-operation choices. Archived account operations SHALL remain readable and SHALL not offer creation, editing or deletion.

#### Scenario: Archived account history
- **WHEN** an account is archived with a nonzero balance and past operations
- **THEN** history, balance and report effects remain visible without financial mutation controls

#### Scenario: Restricted account deletion
- **WHEN** deletion returns 409 because of initial amount or any historical operation, including deleted operations
- **THEN** the account remains visible and the active account can be archived instead

### Requirement: User deletion lifecycle
The system SHALL preserve the backend account-deletion lifecycle: an owner must first transfer or delete owned spaces, and confirmed 202 deletion SHALL revoke local authorization and private cached state.

#### Scenario: Account deletion accepted
- **WHEN** the server accepts account deletion with 202
- **THEN** the application clears the session and does not offer access to previously selected space finances

#### Scenario: Owner prerequisite
- **WHEN** deletion is blocked by ownership of a space
- **THEN** the user can resolve ownership or delete that space before retrying account deletion
