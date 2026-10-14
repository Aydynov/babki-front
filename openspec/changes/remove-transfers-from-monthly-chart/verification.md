# Verification

## Directed checks

- Before the implementation, `node --test src/features/select-chart-currency/model/chart-currency-availability.test.mjs` failed on the new transfer-only case: actual currencies were RUB and USD instead of an empty list.
- After implementation, `node --test src/features/select-chart-currency/model/*.test.mjs` passed all 9 tests. Coverage includes each retained metric, negative savings, incoming/outgoing transfers only, zero/empty data, default selection, retained selection, ISO fallback and no selection.
- The project has no general `npm test` command. These selected `node:test` checks do not establish repository-wide automated coverage; bare `node --test` was not used.

## Repository checks

- `npm run lint` — passed after replacing a test loop with the repository's permitted array iteration style.
- `npm run lint:architecture` — passed, no problems.
- `npm run build` — passed. Existing warning remains for chunks over 500 kB.
- `openspec validate remove-transfers-from-monthly-chart --strict` — passed.
- `git diff --check` — passed.

## Browser verification

Ran `npm run dev -- --host 127.0.0.1 --port 4175 --strictPort` with `FRONT_BASE_API_URL=http://127.0.0.1:4175/api` and local-token mode disabled. Opened `/main` in separate headless Chrome through Playwright, with intercepted synthetic API responses and a synthetic session. No real financial records, private URLs or tokens were used.

Checked at 1440×1000 and 390×844:

- A report with all five source metrics renders exactly three bar series and three legend labels: «Расходы», «Доходы», «Накопления». Transfer values of 900/800 do not appear in bars, legend or tooltip.
- USD tooltip shows expenses 80.00, incomes 30.00 and savings −50.00 in USD; retained colors match the unchanged chart variables.
- RUB/USD are selectable; EUR with incoming transfers only and KZT with outgoing transfers only are absent.
- Period changes fall back from USD to EUR in ISO order when the default is unavailable, and back to default RUB when it becomes available.
- Transfer-only, all-zero and empty reports show «Данные отсутствуют» without a selected currency.
- Delayed reports show the loading skeleton. A failed request shows a retry control, and retry restores the chart.
- No horizontal page overflow on mobile. The existing chart content retains its horizontal scrolling; the narrow screenshot captures the initial visible portion.
- Account details still show the transfers section and open the new-transfer form. Daily and annual category charts retain their empty states with empty datasets. No browser page errors occurred.

Screenshots: [desktop](screenshots/desktop.png), [mobile](screenshots/mobile.png).

## Scope and limitations

Report API schemas, report view models, savings calculations and transfer feature code were not changed. Browser checks use synthetic responses; live backend calculations and transfer mutation persistence are outside this verification.
