# Tasks

## 1. Sort the monthly category rows

- [x] 1.1 Add a pure derivation of configured category rows and selected-bucket totals, sorted by amount descending with configured-list order for ties; verify focused `node --test` cases for descending amounts, missing/zero totals, ties, and different selected buckets.
- [x] 1.2 Render the derived rows in `ExpensesByCategories` using their matched amounts and current currency total; verify in `npm run dev` that switching month or currency reorders rows and preserves amounts, progress, loading, empty, error, and narrow-screen states.

## 2. Integration verification

- [x] 2.1 Run `npm run lint`, `npm run lint:architecture`, and `npm run build`; verify all pass and the change stays within the monthly widget and its focused derivation/test files.
