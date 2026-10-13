## ADDED Requirements

### Requirement: Stable multicurrency widget states
The system SHALL preserve existing loading and geometry guarantees while a widget renders multiple currency buckets or coordinates account metadata with report data.

#### Scenario: Account metadata is required
- **WHEN** report data is available but account or user currency metadata required for presentation is still loading
- **THEN** the widget remains in its structural initial-loading state until all required data is available

#### Scenario: Currency buckets load together
- **WHEN** one response supplies several currency buckets
- **THEN** the widget replaces its skeleton with all validated buckets in one render rather than revealing partial stale sections

#### Scenario: Background multicurrency refresh
- **WHEN** validated currency sections are visible and their shared query refetches
- **THEN** every visible section remains in place until the refreshed response is available

