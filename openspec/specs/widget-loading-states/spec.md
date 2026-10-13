# Widget Loading States

## Purpose

Определить единое визуально стабильное и доступное поведение асинхронных виджетов дашборда во время
первичной загрузки, фонового обновления и отображения пустых результатов.

## Requirements

### Requirement: Skeleton for initial widget loading
Система SHALL отображать структурный skeleton вместо видимого текста «Загрузка...» для каждого асинхронного виджета дашборда, пока обязательные для него данные ещё не получены.

#### Scenario: Initial dashboard request
- **WHEN** пользователь открывает дашборд и обязательные данные виджета отсутствуют в кэше
- **THEN** виджет отображает skeleton, соответствующий типу его содержимого
- **THEN** видимый текст «Загрузка...» не отображается

#### Scenario: Multiple required queries
- **WHEN** виджету нужны результаты нескольких запросов и хотя бы один обязательный результат ещё недоступен
- **THEN** виджет остаётся в структурном loading-состоянии до доступности всех обязательных данных

### Requirement: Stable widget geometry
Система SHALL сохранять внешнюю оболочку, ширину и репрезентативную минимальную высоту виджета при переходе между loading, empty и content состояниями.

#### Scenario: Compact amount card loading
- **WHEN** загружаются данные компактной карточки суммы
- **THEN** loading-состояние занимает ту же внешнюю оболочку и приблизительную высоту, что и закрытая загруженная карточка

#### Scenario: Chart widget loading
- **WHEN** загружаются данные графика
- **THEN** карточка сразу резервирует область графика с его целевыми размерами

#### Scenario: Dynamic collection loading
- **WHEN** загружается таблица или список с заранее неизвестным количеством элементов
- **THEN** карточка отображает репрезентативный набор строк-заглушек и не схлопывается до высоты одной текстовой строки

### Requirement: Stable empty state
Система SHALL сохранять место асинхронного виджета после успешного пустого ответа и отображать empty state внутри его обычной оболочки вместо удаления виджета из сетки.

#### Scenario: No data after skeleton
- **WHEN** запрос успешно завершён, но данных для отображения нет
- **THEN** skeleton заменяется сообщением об отсутствии данных в той же карточке
- **THEN** внешний элемент виджета не удаляется из раскладки

### Requirement: Preserve content during background refresh
Система MUST NOT заменять уже доступное содержимое виджета первичным skeleton-состоянием во время фонового повторного запроса.

#### Scenario: Cached data is being refreshed
- **WHEN** виджет отображает пригодные данные и TanStack Query выполняет их refetch
- **THEN** существующее содержимое остаётся видимым до завершения запроса

#### Scenario: Uncached period is selected
- **WHEN** пользователь выбирает период, для которого пригодных данных ещё нет
- **THEN** виджет показывает skeleton для нового периода вместо значений ранее выбранного периода

### Requirement: Accessible loading feedback
Система SHALL предоставлять единое доступное описание loading-состояния, не добавляя декоративные skeleton-блоки в accessibility tree.

#### Scenario: Assistive technology reads a loading widget
- **WHEN** виджет находится в первичном loading-состоянии
- **THEN** его контейнер помечен как занятый
- **THEN** assistive technology получает одну текстовую индикацию загрузки
- **THEN** отдельные декоративные skeleton-блоки игнорируются

### Requirement: Reduced motion preference
Система SHALL отключать анимацию skeleton для пользователя, запросившего уменьшение движения на уровне операционной системы или браузера.

#### Scenario: Reduced motion is enabled
- **WHEN** активен `prefers-reduced-motion: reduce`
- **THEN** skeleton остаётся видимым без пульсирующей или перемещающейся анимации

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
