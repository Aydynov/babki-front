# Design

## Context

See `proposal.md` for motivation. This is a retrospective change for behavior already implemented during this chat.
Main specs still contain two conflicting rules: empty initial expense account selection and a budget label inside
all financial forms. The four deltas replace those rules or extend existing scenarios without rewriting unrelated requirements.

## Goals / Non-Goals

**Goals:** describe stable interaction semantics, retain historical assignments and archived references, and avoid
category request amplification while preserving cache isolation and error handling.

**Non-Goals:** record CSS values, component appearance, pagination placement, icon sizes or list layouts;
introduce a server-side primary account, alter HTTP DTOs, or synchronize/archive this change automatically.

## Decisions

### Initial expense account comes from the current space list

`getDefaultExpenseAccountId` chooses the first active `balance` account in returned list order. There is no primary
account flag in the contract. Creation passes this value as a form default, while manual changes stay under form control.
An active `saving` account can still be selected manually if no checking account is available.
A new dialog session starts with current defaults; existing expense account and currency remain immutable.

Alternatives: retain explicit selection for every expense, or infer a primary account from its name/profile.
The agreed behavior saves a repeated choice without introducing an undocumented primary-account contract.

### A participant identity has one visible option

The first option represents the authenticated user. The current user is removed from the remaining membership choices.
An untouched new form still omits participantId. Explicit selection, including reassignment back to self, passes a user ID.
A lone self option is rendered read-only after successful membership loading, not as a disabled dropdown.
For editing, the original participant remains represented, including historical actors or a neutral fallback label.
Ownership/permission checks and unchanged-assignment mapping remain in force.

Alternatives: keep a separate empty sentinel alongside the current user's named option, or drop historical assignments
when membership changes. Both obscure the chosen identity or risk silently changing another person's expense.

### Hide archived choices without deleting historical metadata

`AccountSelect` removes archived entries and displays its empty prompt outside the selectable list.
`CategorySelect` resolves its displayed current category from all supplied options but only renders active menu entries.
This preserves unchanged historical category IDs while preventing new selection of an archived category.
Shared selectors also affect their existing consumers in other operation forms; their eligibility rules remain unchanged.

### Focus moves only for a newly added item

The form records the new draft ID before appending it. A name-input mount callback consumes that ID once and focuses
the input, allowing native focus scrolling. Existing rows do not autofocus when opening an edit form or rerendering.
The scroll container reserves room for the external focus indication without removing scrolling. Scroll padding
keeps that indication visible after native autofocus scrolling; the header wraps controls at narrow widths.

Alternative: scroll to the bottom without focus. Focus was selected because users can immediately type a name.

### Category normalization uses the application's existing query cache

`resolveExpenseCategory` uses the scoped category-list query and the existing shared QueryClient. A fresh list avoids
network traffic; concurrent list consumers share a request. Unknown IDs or list failures use the scoped detail query,
which also deduplicates concurrent requests. Both expenses and limits call this resolver for normalization.
Archived entries remain in the reference cache. Category mutation invalidation refreshes the same scoped query families.

The resolver does not add an independent cache or TTL. Category requests use their own query signal so cancellation of
one expense consumer cannot cancel metadata required by another; the cancelled consumer checks its own signal before
accepting the result. Existing expense placeholders/retry and limit errors remain the recovery paths.

Alternatives: keep the N+1 reads, deduplicate only within one expense page, or require populated categories from the
backend. The shared cache also covers limits and already-loaded selectors without changing the server contract.

### Budget ownership remains enforced without a form-local label

The global budget selector continues to show the active space. Removing `BudgetLabel` and inline copies does not
change scoped IDs, query keys, permission checks, or safe context transitions. The budget-context delta updates the
mandatory display rule rather than weakening ownership restrictions.

## Risks / Trade-offs

- Returned account order determines the default; it is not a durable “primary account” setting. A future explicit
  primary-account contract would be a separate change.
- A current historical participant/category must remain representable after membership changes or archival.
  These edge cases were verified with synthetic HTTP fixtures (see `verification.md`); do not normalize them
  to self or an arbitrary active category.
- Hiding an account prompt removes the UI action that previously cleared an account choice. Empty initial states
  remain possible and submission validation must continue rejecting them.
- Shared metadata requests can outlive one consumer. Abort checks and user/space-scoped keys prevent consumption
  in a cancelled or different context; existing logout/context cache clearing remains responsible for lifecycle cleanup.
- Cache freshness follows existing query policy and invalidation. This change does not promise no requests after
  expiry, invalidation, or a failed category lookup.
- The HTTP regression simulation uses synthetic fixtures matching the local contracts. It does not prove real
  backend authorization, accounting, persistence, or production latency.

## Migration Plan

No data migration or new dependency is required. Review the deltas and completed checks in `tasks.md`, then explicitly
synchronize them into the four main specs. Archive after synchronization and review. A product rollback
would restore prior frontend selection/reference-resolution behavior; changing these documents alone does not deploy code.
