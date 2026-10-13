# Backend contract audit

Audit source: the current `../babki-back` working tree on `feat/currency`, including its
`add-multicurrency-accounts` OpenSpec change, DTOs, controllers, schemas, and response builders.

## Confirmed breaking contracts

| Area | Backend contract | Frontend drift before implementation |
| --- | --- | --- |
| User/auth | User response: `defaultCurrency: string`, `defaultAccountId: ObjectId \| null`; registration request: `currency` | User response omits both fields; registration form value must be mapped to the wire field |
| Accounts | `/accounts` list/create/detail/rename/archive/delete; named `balance \| saving` accounts with currency, opening metadata, amount, and timeline | Separate `/balances` and `/savings` clients assume one account per type |
| Transactions | `income \| expense \| transfer`; filters include `accountId` and `currency` | Union still contains `save`; general filters are single-account-era |
| Income/expense | Create requires `accountId`; response stores `accountId`, `snapshotId`, and `currency`; update cannot change account/date | Create forms omit account and all rendering assumes locale currency |
| Revenue | `{ totalRevenue: number \| null, currencies: { currency, totalRevenue }[] }` | Scalar revenue schema cannot represent multiple currencies |
| Transfers | `/transfers` CRUD with paired source/destination effects and derived directed effective rate | `/saves` uses one amount and one source/target assumption |
| Limits | Create/list/revenue include currency; persisted currency is immutable | Limits are unique only by category/month and use implicit currency |
| Plans | Create/list include currency; close requires a matching `accountId` | Plans omit currency and close has no account selection |
| Debts | Create/list include currency; income-producing repayment requires matching `accountId` | Debts omit currency and repayment account context |
| Reports | Every period contains `currencies[]` buckets with income, expense, transfer-in/out, balance, saving, and category totals | Widgets consume one scalar period and sometimes inject locale currency into queries |

## Response and lifecycle details

- Account list responses include archived accounts; new-operation eligibility must filter `archivedAt !== null` in the client UI.
- Account type, currency, initial amount, and opening date are immutable; rename accepts only `name`.
- Permanent account deletion returns `204` and is restricted for a non-zero initial amount or any financial history;
  archive also returns `204` and clears a matching default account.
- Transfer update accepts only source amount, destination amount, and description; accounts and transaction date are immutable.
- Same-currency transfers require equal normalized amounts. Cross-currency rate direction is
  `destination.amount / source.amount` with source as base and destination as quote.
- Generic transaction `accountId` filtering matches scalar income/expense account ids and both transfer effect account ids.
- Debt repayment permits an absent account only when `isIncome` is false.
- Report buckets are generated for known account currencies even when a period has no activity.

## Drift from planning artifacts

No scope-changing backend drift was found. The implementation must preserve two details that are easy to miss:

1. `totalRevenue` remains in income/expense revenue responses for single-currency compatibility but becomes `null` when
   multiple currencies exist; widgets must use `currencies[]` as the source of truth.
2. The backend derives its supported catalog from the runtime `Intl.supportedValuesOf('currency')`; the frontend catalog
   must be normalized and tested against seeded RUB/USD values rather than accepting arbitrary three-letter strings.
