# Проверка improve-expense-limits-widget

Дата: 2026-10-24. Данные, учётная запись и названия счетов — синтетические.

## Автоматические проверки

Успешно выполнены:

```sh
npm run lint
npm run lint:architecture
npm run build
node --test src/entities/expense-limits/api/limit-cache.test.mjs src/features/manage-expense-limits/model/multicurrency-limit.test.mjs src/entities/expense-limits/model/presentation.test.mjs src/widgets/expense-limits/model/currency-options.test.mjs src/features/select-chart-currency/model/resolve-chart-currency.test.mjs
```

Все 11 точечных тестов прошли. Проверены валюты счетов (включая накопительные и архивные), ISO-порядок,
выбор и fallback, фильтрация без перестановки API-строк, итог, нулевой total / перерасход, точность,
дубликаты по валюте, календарные даты и форматирование суммы.
Регрессия кэша использует настоящие mutation hooks / QueryClient со stub только транспортного API:
отмена устаревшего чтения, обновление list/detail, фильтры месяца / категории / валюты, удаление,
ошибка последующей инвалидации, изоляция scope и смена пользователя. Для неё подтверждён red/green
относительно исходного query-модуля.

В проекте нет общего `npm test`; bare `node --test` не использовался как общий поддерживаемый прогон.
Build успешен с предупреждением Vite о чанках более 500 kB.

## Браузер и локальный HTTP

Использованы Chrome / Playwright и `npm run dev` (порт 5181) против локальной Postman simulation (4931):

```sh
postman simulation run postman/simulations/space-finance.sim.yaml --port 4931
FRONT_BASE_API_URL=http://127.0.0.1:4931/api/api/v1 FRONT_USE_LOCAL_AUTH_TOKEN=false FRONT_LOCAL_AUTH_TOKEN= npm run dev -- --host 127.0.0.1 --port 5181 --strictPort
```

Временные проверочные сценарии: `/tmp/limit-ui-check.cjs`, `/tmp/limit-regression-check.cjs`,
`/tmp/limit-edge-check.cjs`, `/tmp/limit-loading-check.cjs`, `/tmp/limit-navigation-check.cjs`.
Они выполняют реальные действия в браузере; основной сценарий и mutations используют localhost HTTP.
Для удержания pending и ошибок загрузки отдельных запросов используются перехваты браузера.

Подтверждено:

- RUB / USD / EUR берутся из счетов, EUR доступна без лимитов; создание первого EUR-лимита отправляет
  выбранную валюту и даты 01–31 октября, поля валюты в строках отсутствуют.
- В RUB видны только RUB-строки. Прогресс 60%, при перерасходе 100%; отрицательный остаток виден в деталях.
  Открытие мышью и Enter не делает дополнительных запросов списка расходов.
- Из меню деталей открывается общий менеджер с фокусом суммы нужной строки. Сохранение оставляет его
  открытым. Несохранённая соседняя строка переживает save и refetch; Escape возвращает детали и сбрасывает
  черновики. При повторном открытии отображаются сохранённые значения.
- Live-total follow-up supersedes the saved-total checks: 600 -> 650 immediately after entering 150,
  then 450 after clearing the second row; a temporary amount of 25 gives 475, removing it restores 450.
- Добавление — компактная прозрачная кнопка слева. Есть плейсхолдеры. На ширине 320 px нет горизонтального
  переполнения; при высоте 360 px длинный список реально прокручивается до последней редактируемой строки.
- Отмена удаления не отправляет DELETE; описание без категории. Ошибка update сохраняет введённую сумму,
  ошибка delete оставляет подтверждение и позволяет retry. Во время save закрытие / Escape заблокированы.
- Стрелка возвращает из редактирования в детали; крестик и backdrop закрывают окно полностью.
- Начальная загрузка сохраняет заголовок и шестерёнку. Отдельно проверены ошибки accounts и limits,
  локальный retry, а также ошибки refetch с сохранением ранее загруженных строк и валюты. Без счетов
  есть пояснение и отключённое управление; в валюте без лимитов доступно создание первой строки.
- Pending удаления блокирует отмену и Escape. Смена месяца закрывает менеджер и сбрасывает dirty значения;
  возвращение в октябрь показывает сохранённую сумму. Удаление последнего USD-счёта закрывает менеджер,
  выбирает EUR и не переносит USD-черновики. Переход в другой бюджет также закрывает окно.
- Без manageLimits скрыты шестерёнка и меню, просмотр доступен. При исчезновении открытого лимита окно
  закрывается и фокус возвращается на доступный элемент виджета (включая саму карточку для read-only).
- Три замечания ревью воспроизведены отдельными браузерными регрессиями до исправления и прошли после:
  изменение суммы сохраняет category-conflict; ответ save ищет строку по стабильному ключу, если соседняя
  строка исчезла; фокус read-only возвращается на карточку.

## Скриншоты

- [Общее управление, desktop](verification/limits-management-desktop.png)
- [Общее управление, 320 px](verification/limits-management-mobile.png)
- [Детали, 320 px](verification/limit-details-mobile.png)

## Границы проверки

`openspec validate improve-expense-limits-widget --strict` и `git diff --check` прошли.

Локальная симуляция проверяет взаимодействие интерфейса и настоящих frontend API clients с HTTP,
но не доказывает серверные права, учёт, персистентность или конкуренцию реального backend.
Fixture дополнен ответами лимитов с вычисленным остатком, фильтрацией периода / валюты / категории,
созданием и изменением суммы. Внешние сервисы и приватные данные не использовались.

## Уточнения после проверки

По запросу пользователя удалена нижняя кнопка со стрелкой. Escape из редактирования по-прежнему
возвращает детали. Остаток перенесён сразу после периода. Браузерная проверка
`/tmp/limit-followup-check.cjs` подтвердила порядок полей, отсутствие кнопки и Escape;
desktop / mobile скриншоты обновлены. Повторно прошли lint, lint:architecture и build.

## Live-total follow-up

The summary now uses current form values, including unsaved and temporary rows without a category.
Empty and non-finite values contribute zero. Finite values participate even if row validation fails.
`/tmp/limit-live-total-check.cjs` passed: immediate edits, clearing, temporary add/remove and extra precision.
Lint, architecture lint, build, strict OpenSpec validation and diff-check passed again.

## Row actions follow-up

`/tmp/limit-row-actions-check.cjs` passed against the local HTTP simulation:

- Save appears immediately left of the amount, restore immediately right, on desktop and 320 px.
- Editing a persisted amount hides delete and shows restore; restore resets only that row and updates the live total.
- A neighbouring dirty amount survives restore. After saving 150, a later edit restores 150 instead of the initial 100.
- Clearing the input can also be restored. Temporary rows retain delete because they have no saved baseline.
- Mobile has no horizontal overflow. Desktop/mobile screenshots were refreshed.

Lint, architecture lint, build, strict OpenSpec validation and diff-check passed again.
