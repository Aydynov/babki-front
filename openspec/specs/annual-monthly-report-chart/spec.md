# annual-monthly-report-chart Specification

## Purpose

Определить период годового графика «Расходы по месяцам», чтобы пользователь видел доступные помесячные данные за весь выбранный календарный год независимо от месячного фильтра.

## Requirements

### Requirement: Full selected calendar year
The annual monthly report chart SHALL request data from January 1 through December 31 of the selected year, including when the selected year is the current calendar year. It SHALL display returned monthly data across that full range without truncating it to the selected month or today's date.

#### Scenario: Current year with an early selected month
- **WHEN** the user selects the current year and February while the report contains expense data for September of that year
- **THEN** the chart requests January 1 through December 31 of the selected year
- **THEN** September's expense data appears for the selected chart currency

#### Scenario: Past year
- **WHEN** the user selects a past year
- **THEN** the chart requests January 1 through December 31 of that year
- **THEN** the chart displays that year's returned monthly data

#### Scenario: Data after today's date
- **WHEN** the current year's report returns monthly data after today's date
- **THEN** the chart includes that data for the selected chart currency

### Requirement: Independent annual period selection
The annual monthly report chart's reporting period SHALL depend only on the selected year. Changing the selected month within the same year SHALL preserve the annual reporting period and displayed annual dataset.

#### Scenario: Change the month within one year
- **WHEN** the user changes the selected month from February to October without changing the selected year
- **THEN** the annual chart retains the same January 1 through December 31 reporting period
- **THEN** the month change does not filter its annual dataset

#### Scenario: Change the year
- **WHEN** the user changes the selected year from 2026 to 2025 while keeping February selected
- **THEN** the chart requests January 1 through December 31 of 2025
- **THEN** the chart displays the returned 2025 data instead of the 2026 data
