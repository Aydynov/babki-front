# Проверка семейного бюджета

Интеграция: 18–20 октября 2026 года. Ветка `codex/add-family-budget-ui`.
Реализация находится в рабочем дереве; commit, PR и архивирование change не выполнялись.

## Итог реализации

Добавлены личный/семейный контекст, переключатель и каталог групп, создание семьи, участники,
четыре независимых права и полное финансовое управление одним PATCH. Реализованы приглашения,
регистрация с возвратом к приглашению, совместные счета/накопления, операции, категории,
лимиты, отчёты, планы и долги «нам должны». Переводов между бюджетами и долгов «мы должны» нет.

FSD-срез называется `entities/budgets`: множественное число требуется архитектурной проверкой.
Query keys включают сущность, подтверждённый userId, kind и ownerId. Формы и callbacks захватывают
исходный scope; поздний ответ после logout не восстанавливает чужие данные.
Групповой исторический остаток считается по полному paginated ledger в minor units.
Неполная история остаётся ошибкой. Несуществующий групповой snapshots endpoint не вызывается.

В ходе интеграции исправлены: личные includeArchived-параметры, лишние годы 2000–2099,
потеря точности числового ObjectId в URL, сохранение устаревших прав после успешного POST и
неуспешного GET, недоступность автора расхода без позиций, PATCH неизменённой суммы дохода,
восстановление после income404, своевременное удаление invitation secret на auth-экранах,
повтор загрузки недоступной категории и совместимость семейства ключей личной истории доходов.

## Команды и результаты

Итоговые `npm run lint`, `npm run lint:architecture`, `npm run build` — успешно.
`openspec validate add-family-budget-ui --strict` и `git diff --check` — успешно.
Vite сообщает о размере крупных chunks. Новые зависимости не добавлялись.
`src/routeTree.gen.ts` обновлён Vite-плагином из новых route files.

Адресный набор change — **41 passed, 0 failed**:

```sh
node --test \
  src/shared/lib/budget-scope/budget-scope.test.mjs \
  src/shared/lib/budget-api/budget-invalidation.test.mjs \
  src/entities/accounts/model/budget-ledger.test.mjs \
  src/entities/accounts-snapshots/api/scoped-reads.test.mjs \
  src/entities/groups/model/*.test.mjs \
  src/entities/groups/api/group-cache.test.mjs \
  src/entities/reports/api/group-year-range.test.mjs \
  src/entities/expenses/api/group-category.test.mjs \
  src/features/manage-income/model/income-edit.test.mjs \
  src/entities/plans/model/*.test.mjs src/entities/debts/model/*.test.mjs \
  src/features/create-plan/model/*.test.mjs src/features/create-debt/model/*.test.mjs \
  src/features/manage-plan/model/*.test.mjs src/features/manage-debt/model/*.test.mjs \
  src/shared/lib/pending-invitation/pending-invitation.test.mjs \
  src/features/group-invitations/model/invitation-errors.test.mjs \
  src/features/auth/model/redirect.test.mjs src/features/auth/model/end-session.test.mjs
```

Финансовые регрессии — **74 passed, 0 failed**; набор частично пересекается с предыдущим:

```sh
FRONT_BASE_API_URL=http://localhost/api FRONT_USE_LOCAL_AUTH_TOKEN=false node --test \
  src/entities/accounts/model/*.test.mjs src/entities/incomes/model/*.test.mjs \
  src/entities/incomes/api/income-history.test.mjs \
  src/entities/transactions/api/account-history.test.mjs \
  src/entities/transactions/model/multicurrency-union.test.mjs \
  src/entities/expenses/model/multicurrency-contract.test.mjs \
  src/entities/expense-limits/model/multicurrency-contract.test.mjs \
  src/entities/transfers/model/*.test.mjs src/entities/reports/model/*.test.mjs \
  src/features/create-income/model/*.test.mjs src/features/manage-accounts/model/*.test.mjs \
  src/features/manage-expense/model/expense-form.test.mjs \
  src/features/manage-expense-limits/model/*.test.mjs src/features/manage-transfer/model/*.test.mjs \
  src/shared/lib/currency/*.test.mjs src/shared/lib/paginated-history/*.test.mjs
```

HTTP-тест истории требует временного loopback-порта. В sandbox первоначально получен EPERM;
разрешённый повтор выявил несовместимость ключа кэша, исправленную до итогового зелёного запуска.
Общий `node --test` и `npm test` не объявляются рабочими entry points проекта.

## Локальный API и настоящие браузерные действия

Использовались только локальный API и отдельные тестовые группы/аккаунты с адресами example.invalid.
Токены и пароли не печатались. Браузерный сервер на 5180 запускался с отключённым встроенным
local-auth token; конфигурация проекта и env-файлы не менялись.

- Через UI созданы семья и первый счёт. Принятый invitation fragment исчезает до auth-перехода.
  Регистрация возвращает к `/join`; явное вступление открывает семью с четырьмя false.
- Кнопка полного доступа отправила ровно один PATCH. Супруга сохранила member и получила четыре true.
  Через фронтовые API-адаптеры она изменила доход супруга и добавила общие операции.
- UI расхода прошёл создание и подтверждённое удаление. В деталях счёта показаны авторы,
  знаки операций, перевод и исторический остаток. Автор виден и у расхода без позиций.
- План показывает 100 запланировано, 120 фактически и ссылку на расход; повторное исполнение
  недоступно. Долг показывает 260 остатка, денежную/неденежную историю и автора отмены.
- На отдельных аккаунтах 20 октября проверены отзыв прав с прежним JWT (403), передача владения
  со сбросом прав, исключение и выход (404), отзыв приглашения (400).
  Передача владения выполнена также клавиатурой в UI на 320 px. Бывшему владельцу скрыто удаление.
  Подтверждённые UI leave/delete открыли personal с уведомлением. Эта тестовая группа удалена.
- Явный personal переживает refresh. Смена personal/двух семей убирает прежние счета и сохраняет месяц.
- Дополнительная проверка недоступной категории выполнялась с настоящим расходом и локально
  подменённым загрузчиком категории. Сумма осталась видимой; кнопка повтора восстановила категорию.
  Временный расход удалён, категория архивирована после ожидаемого RESTRICT409.

Точный финансовый сценарий 18 октября:

| Событие | Расчётный USD | Накопления USD | Остаток долга USD |
| --- | ---: | ---: | ---: |
| Начальный остаток | 1000 | 0 | — |
| Доход супруга 500 | 1500 | 0 | — |
| Общие продукты 100 | 1400 | 0 | — |
| Перевод в резерв 200 | 1200 | 200 | — |
| План 100 исполнен за 120 | 1080 | 200 | — |
| Создан долг 300 | 1080 | 200 | 300 |
| Денежное погашение 60 | 1140 | 200 | 240 |
| Неденежное погашение 40 | 1140 | 200 | 200 |
| Отмена денежного погашения | 1080 | 200 | 260 |

Текущие счета и полный ledger на конец октября дали 1080/200. До даты открытия — 0/0.
Месячный отчёт: incomes500, expenses220, transfersIn200, transfersOut200, saving200, balance1080.
Годовой API вернул один год. Во второй семье KWD1 + income0.001 дали ledger1.001;
личные счета супруги остались пустыми. Повтор close отклонён с 400, повтор cancel — с 409.

## Контролируемые ошибки и статические проверки

Следующие браузерные проверки использовали подмены ответов/состояний; они не доказывают поведение сервера:

- Group503 сохраняет URL и закрывает финансовое поддерево; group404 очищает контекст и открывает personal
  с уведомлением. Financial404 отдельно проверен helper-тестом закрытия editor без смены бюджета.
- Каталог из 21 группы: переход на страницу 2, выбор группы и refresh при нахождении выбранной группы
  вне первой страницы. Длинное название не даёт горизонтального overflow на 320 px. Native selector
  проверен клавиатурой Home/Enter.
- Реальный history.back с черновиком: отклонение подтверждения сохраняет форму и адрес;
  согласие открывает personal. Контролируемая pending Query mutation блокирует selector и history.
  Нативный beforeunload также отменял переход с несохранённым переводом.
- Две вкладки одного пользователя одновременно показывали разные явные бюджеты.
  Explicit logout удалил active token и pending invitation. Временные test secrets очищены.
- Join: 429 блокирует повтор с отсчётом; при недоступном CORS-заголовке применяется fallback60.
  Разбор Retry-After секунд/HTTP-date покрыт unit-тестом. Проверены 503 и успешная повторная preview,
  клавиатурное вступление, потеря ответа accept без автоматического повтора и явный повтор409.
  URL оставался `/join`. Clipboard failure показывает объяснение; revoke409 перечитывает список.
- QueryClient-тесты используют настоящие mutation callbacks: personal/две группы/две identity,
  поздний ответ после logout и смены userId, ошибка активного refetch при успешном POST.
  Успех сохраняется, POST не повторяется. Подтверждённые ownership/permissions применяются до refetch.
- Ledger-тесты проходят 205 записей, промежуточную ошибку, изменившийся total, дубликаты,
  отрицательный остаток и KWD minor units. Контрактные/формовые проверки покрывают архивные счета,
  immutable-поля, обязательный isIncome, некассовые погашения, точность и независимость валют.

## Ограничения и оставшаяся приёмка

Повторная проверка с нуля 20 октября закрыла task6.2: JPY1 и KWD0.001 успешно проведены
через новые счета, доходы, расходы, ledger и отчёты. Первоначальное предположение об ошибке JPY
уточнено: второй balance возвращает503 независимо от валюты, а одно название категории
конфликтует между новыми семьями с409. Tasks5.4 и6.5 открыты повторно для приёмки после
исправления бэка. Подробности — в [runtime-findings](../../../docs/family-budget-runtime-findings.md),
запросы и результаты — в [fresh-data-retest](fresh-data-retest-2026-10-20.json).
Это исторический результат до пересоздания dev-базы.

После пересоздания dev-базы выполнен новый запуск на двух новых аккаунтах и двух новых семьях:
**22 проверки прошли, неожиданных5xx нет**. Несколько balance, одинаковые имена счетов и одинаковые
названия категорий разных семей работают. Дополнительно проверены rename/archive/read, RESTRICT409,
лимиты с нулевым total и валютным пересечением, приглашение, выдача/отзыв прав с прежним JWT,
операции обоих супругов, межвалютный перевод, plan100/actual120, debt repay/noncash/cancel,
изолированность personal и второй семьи. Сверены текущие/исторические остатки и валютные отчёты:
JPY1080/101/накопления200, KWD0.999, долг260; вторая семьяJPY50 не затронута.
UI на1440/320px не показал error-alert и горизонтального overflow.
См. [after-db-reset](after-db-reset-2026-10-20.json). Tasks5.4 и6.5 закрыты, итог49/49.
Исходная причина индексов остаётся гипотезой: старые и новые индексы не сравнивались.

Полная браузерная матрица TOTP/recovery, реальные 21 участник, реальные потерянные ответы close/cancel,
архивирование каждой комбинации связанных сущностей и произвольные очень большие суммы не выполнялась.
Для этих случаев использовались контрактные проверки, чтение обработчиков и общие UI primitives;
отдельная live-гарантия не заявляется. Проверка join после регистрации использовала пароль.

Ранние отчёты [invitations](verification-invitations.md) и [plans/debts](verification-plans-debts.md)
фиксируют промежуточные состояния. Итоговые результаты интеграции приведены здесь.
Бэк агентом не изменялся. Автоматическое архивирование не выполнялось.

## Screenshots

Только искусственные данные; invitation secret, пароли и email отсутствуют.

- [Dashboard desktop, 1440 px](screenshots/dashboard-desktop.png)
- [Debt details, 320 px](screenshots/debt-mobile.png)
- [Long group selector, 320 px](screenshots/selector-mobile.png)

## Визуальная доработка — 2026-10-20

После функциональной проверки выполнен запрос на оформление семейных экранов в стиле проекта.
Результаты ручного UI-прохода, ограничения проверки ошибок и новые скриншоты описаны в
[verification-ui-polish.md](./verification-ui-polish.md). Повторные lint, архитектурная проверка,
build и строгая OpenSpec-валидация прошли. Финансовые результаты предыдущих разделов этим
этапом не пересматривались.
