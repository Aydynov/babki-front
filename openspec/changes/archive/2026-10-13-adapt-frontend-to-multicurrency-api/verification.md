# Verification

## Focused automated tests

The repository has no supported `npm test` command or configured repository-wide test runner. The tests touched by
this change are colocated native `node:test` files and are run explicitly:

```bash
node --test \
  src/shared/lib/currency/currency.test.mjs \
  src/shared/lib/currency/currency-primitives.test.mjs \
  src/entities/users/model/currency-contract.test.mjs \
  src/features/auth/model/auth-form.test.mjs \
  src/entities/accounts/model/accounts-contract.test.mjs \
  src/entities/accounts/model/account-eligibility.test.mjs \
  src/widgets/accounts/accounts-widget.test.mjs \
  src/features/manage-accounts/model/account-form.test.mjs \
  src/entities/incomes/model/multicurrency-contract.test.mjs \
  src/features/create-income/model/create-income-form.test.mjs \
  src/entities/expenses/model/multicurrency-contract.test.mjs \
  src/features/manage-expense/model/expense-form.test.mjs \
  src/entities/transfers/model/transfers-contract.test.mjs \
  src/features/manage-transfer/model/transfer-form.test.mjs \
  src/entities/expense-limits/model/multicurrency-contract.test.mjs \
  src/features/manage-expense-limits/model/multicurrency-limit.test.mjs \
  src/entities/plans/model/multicurrency-contract.test.mjs \
  src/features/create-plan/model/multicurrency-plan-form.test.mjs \
  src/features/manage-plan/model/multicurrency-close-plan.test.mjs \
  src/entities/debts/model/multicurrency-contract.test.mjs \
  src/features/create-debt/model/multicurrency-debt-form.test.mjs \
  src/features/manage-debt/model/multicurrency-repay-debt.test.mjs \
  src/entities/transactions/model/multicurrency-union.test.mjs \
  src/entities/reports/model/multicurrency-report.test.mjs
```

Result on 2026-09-26: 77 tests passed, 0 failed.

## Static and production checks

Run before handoff:

```bash
npm run lint
npm run lint:architecture
npm run build
```

The Vite production build currently emits its existing chunk-size advisory; it is not a build failure.

## Manual verification

Verified on 2026-09-26 with the updated backend and the existing development seed data:

- registration renders the required `defaultCurrency` field (RUB by default) on a temporary no-local-auth frontend and
  maps it to the backend registration request field `currency`;
- dashboard renders RUB and USD account balances, incomes, expenses, transfers, category reports, yearly cards,
  plans, debts, and limits as separate currency values/sections without a global selector;
- account management exposes create, rename, default, archive, and delete controls plus explicit lifecycle
  confirmation dialogs; a dedicated temporary RUB account with a non-zero opening amount returned HTTP 409 on DELETE
  and was then archived successfully (HTTP 204), without targeting any primary seeded account;
- income and expense creation preselect the eligible default account and expose all active account currencies;
- transfer creation excludes the selected source from destinations and shows `1 RUB = 0,015 USD` for a temporary
  cross-currency draft without submitting it;
- transfer history resolves both account names and displays both monetary effects, directed effective rate, date, and
  description; the monthly report chart renders month labels from the `period` view-model field;
- limit, plan, and debt creation expose explicit currency scope; persisted limits show their immutable currency;
- desktop 1440-pixel and narrow 320-pixel views have no document-level horizontal overflow
  (`scrollWidth === clientWidth`); dialogs remain usable at 320 pixels;
- account and transfer dialogs receive focus on open, are keyboard-addressable, and restore focus to their trigger;
- skeleton, stable empty-card geometry, accessible recoverable errors, and cached-refetch rendering were checked in
  source; stopping the complete API during a reload is intercepted by the authenticated route shell before individual
  widgets mount, so shared widget failure isolation cannot be induced end-to-end from that state.

The destructive `npm run seed` command was not rerun because it clears the development collections first; the
already-populated RUB/USD seed database was used instead.

## Final review

An independent read-only review was run after implementation. Its contract, cache, readiness, account-lifecycle,
and transfer edge-case findings were fixed; the post-fix review reported no remaining findings.
