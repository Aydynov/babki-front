# Spec Delta

## MODIFIED Requirements

### Requirement: Transfer-aware reports
The system SHALL preserve transfer movements separately from income and expense totals in report data. The monthly dashboard chart SHALL omit transfer movements and display only expenses, incomes, and savings; this presentation rule SHALL NOT change transfer data or the calculation of the retained metrics.

#### Scenario: Same-currency transfer in a period
- **WHEN** a transfer occurs between two accounts in one currency
- **THEN** transfer-in and transfer-out values remain independently available in report data and neither changes income or expense totals
- **THEN** neither transfer value appears as a series in the monthly dashboard chart

#### Scenario: Cross-currency transfer in a period
- **WHEN** a transfer moves value between different currencies
- **THEN** the source amount contributes only to that currency's transfer-out total and the destination amount contributes only to its currency's transfer-in total
- **THEN** these transfer totals do not appear as series in the monthly dashboard chart
