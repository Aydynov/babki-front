# group-financial-operations Specification

## Purpose

Определить совместный учёт расходов, доходов и переводов семьи с общими категориями,
лимитами и валютными отчётами при соблюдении серверных прав и происхождения записей.

## Requirements

### Requirement: Shared family expenses
Система SHALL показывать общие расходы пространства с автором и участником. При создании participantId SHALL быть необязателен и по умолчанию назначаться сервером автору. Явный выбор SHALL ограничиваться действующими участниками; фильтр participantId SHALL выбирать участника расхода, а не автора.

#### Scenario: Create a shared expense
- **WHEN** участник создаёт расход без явного назначения
- **THEN** отправляются выбранные счёт и категория пространства без participantId, сервер назначает автора участником

#### Scenario: Edit an imported participant assignment
- **WHEN** расход назначен другому человеку
- **THEN** обычное изменение других полей сохраняет назначение; переназначение доступно владельцу, автору или manageTransactions

#### Scenario: Assign a participant
- **WHEN** уполномоченный пользователь явно выбирает участника из любого доступного листа каталога
- **THEN** отправляется его participantId, а авторство не меняется

#### Scenario: Filter a former participant
- **WHEN** исторический расход принадлежит бывшему участнику
- **THEN** запись и participantActor сохраняются, фильтр по его id не подменяется фильтром автора

#### Scenario: Represent the current user once
- **WHEN** the participant options are available in an expense creation or permitted reassignment form
- **THEN** the first option is «Вы (по умолчанию)» and represents the current authenticated user
- **THEN** that user does not also appear under their personal name in the remaining options
- **THEN** opening creation without an explicit assignment still omits participantId and lets the server assign the author

#### Scenario: Only the current user is available
- **WHEN** participant loading succeeds and the only available assignment is the current user
- **THEN** the participant field remains visible as «Вы (по умолчанию)» in a read-only control without a dropdown

#### Scenario: Other participants are available
- **WHEN** the space has other current members and reassignment is permitted
- **THEN** the user can choose one of them and can subsequently choose «Вы (по умолчанию)»
- **THEN** an explicit reassignment to self represents the authenticated user's participantId, not an unchanged-assignment sentinel

#### Scenario: Preserve a historical participant during editing
- **WHEN** an expense's existing participant is another person who is absent from the current member list
- **THEN** that participant remains representable as the current assignment using the returned actor when available
- **THEN** editing unrelated fields does not silently replace that assignment with the current user
- **THEN** absence of other current members alone does not force this historical assignment into the read-only self field

### Requirement: Scope-specific operation contracts
Система SHALL проверять запросы пространства и ответы по их действующему контракту, не отправляя
поля личного API. Доход SHALL содержать счёт, сумму, дату и необязательное описание без source;
категория расхода SHALL разрешаться из идентификатора пространства без требования populated-ответа.

#### Scenario: Category metadata is loading
- **WHEN** расход загружен, но его категория ещё не разрешена
- **THEN** интерфейс не объявляет ответ невалидным из-за формы категории и показывает соответствующее состояние загрузки

#### Scenario: Category is unavailable
- **WHEN** сведения категории не удалось загрузить
- **THEN** запись и её сумма остаются различимы с нейтральной подписью и повтором запроса без подстановки чужой категории

#### Scenario: Typed operation endpoints
- **WHEN** запрошены детали, изменение или удаление дохода, расхода либо перевода
- **THEN** используется /spaces/:spaceId/incomes/:id, /expenses/:id либо /transfers/:id согласно типу
- **THEN** общая коллекция /transactions используется только для списка без /transactions/:id

#### Scenario: Immutable operation identity
- **WHEN** отправляется PATCH дохода или расхода
- **THEN** accountId, transactionDate, currency и createdBy отсутствуют; income содержит только amount/description, expense также допускает categoryId/participantId/merchant/items

### Requirement: Currency-safe family entry
Система SHALL использовать валюту выбранного общего счёта, проверять положительные суммы и
точность по её minor units и запрещать дату раньше открытия счёта. Активные balance и saving
счета SHALL быть доступны для прямых доходов и расходов пространства; архивные — недоступны.

#### Scenario: Small supported amount
- **WHEN** введены KWD 0.001 или JPY 1
- **THEN** валидная операция может быть отправлена, а RUB 0.001 и JPY 0.1 отклоняются до запроса

#### Scenario: No eligible account
- **WHEN** подходящих активных общих счетов нет
- **THEN** отправка недоступна; создание счёта предложено только при manageAccounts

#### Scenario: Preserve personal entry rules
- **WHEN** в пространстве только один участник
- **THEN** действуют те же правила balance/saving счетов и доход без source, без личной ветки API

#### Scenario: Exclude archived accounts from choices
- **WHEN** an operation's account selector is opened
- **THEN** archived accounts are absent from the dropdown rather than appearing as disabled choices
- **THEN** existing operation-specific eligibility and currency restrictions remain enforced

#### Scenario: Keep an empty account prompt outside the dropdown
- **WHEN** an account has not been selected
- **THEN** the control can display its selection prompt without adding a selectable empty option to the dropdown
- **THEN** after choosing an account the user cannot clear it by selecting «Выберите счёт»

### Requirement: Permission-aware financial actions
Система SHALL разрешать чтение и создание обычных операций действующему участнику; изменение
и удаление SHALL учитывать владельца, автора, участника расхода и manageTransactions.
Права настроек SHALL не трактоваться как право на чужие операции.

#### Scenario: Spouse manages the other spouse's records
- **WHEN** участник получил manageTransactions
- **THEN** допустимые действия чужих доходов, расходов и переводов доступны с сохранением исходного авторства

#### Scenario: Permission revoked
- **WHEN** действие получило 403 после отзыва прав
- **THEN** данные формы сохраняются, показано объяснение, перечитаны права без завершения сессии

#### Scenario: Participant edits someone else's expense
- **WHEN** текущий участник расхода не является его автором и не имеет manageTransactions
- **THEN** ему доступны допустимые изменения и удаление расхода, но не переназначение participantId

#### Scenario: Settings permission is independent
- **WHEN** участнику выдано manageAccounts, manageCategories или manageLimits без manageTransactions
- **THEN** это не открывает чужие финансовые мутации или управление членством

### Requirement: Intra-group transfers
Система SHALL предоставлять переводы из деталей счёта между двумя разными активными счетами
выбранного пространства, включая накопления и разные валюты. Счета других пространств
SHALL отсутствовать в выборе; отдельного виджета переводов SHALL не добавляться.

#### Scenario: Same-currency transfer
- **WHEN** валюты сторон совпадают
- **THEN** пользователь вводит одну сумму, а запрос содержит равные sourceAmount и destinationAmount

#### Scenario: Cross-currency transfer
- **WHEN** валюты различаются
- **THEN** вводятся обе фактические суммы с собственной точностью и показан направленный эффективный курс

#### Scenario: Insufficient source funds
- **WHEN** сервер отклоняет перевод из-за недостатка средств на дату операции
- **THEN** форма сохраняется с ошибкой у исходящей суммы без предположения, что текущий остаток гарантирует перевод

#### Scenario: Edit or cancel transfer
- **WHEN** уполномоченный пользователь управляет переводом
- **THEN** изменяемы только суммы и описание, удаление требует подтверждения, архив любой стороны блокирует мутацию

### Requirement: Shared category and limit management
Система SHALL использовать только категории и лимиты выбранного пространства, показывая управление
категориями при manageCategories, лимитами при manageLimits. Лимит SHALL иметь явную неизменяемую
валюту и учитывать расходы всех участников этой категории и валюты.

#### Scenario: Read without management rights
- **WHEN** участник не имеет прав настроек
- **THEN** категории и лимиты доступны для чтения и обычных операций, но действия их изменения скрыты

#### Scenario: Monthly currency limit
- **WHEN** создаётся общий лимит
- **THEN** отправляются categoryId, currency, total с точностью валюты и полные UTC-границы выбранного месяца
- **THEN** нулевой total допустим, отрицательный нет, пересечение той же категории/валюты обрабатывается как 409

#### Scenario: Referenced category
- **WHEN** удаление категории с финансовыми ссылками отклонено
- **THEN** показано объяснение и предложено архивирование без уничтожения истории

### Requirement: Budget-wide reporting
Система SHALL строить общие виджеты по валютным корзинам выбранного бюджета и полным UTC-периодам,
не складывая разные валюты и не фильтруя общий остаток по участнику. Доходы SHALL получать итог
из отчётов пространства и детали из списка доходов, без обращения к отсутствующему income revenue API пространства.

#### Scenario: Current and previous month income
- **WHEN** показаны общие доходы и сравнение с прошлым месяцем
- **THEN** обе суммы берутся из соответствующих месячных отчётов пространства по каждой валюте

#### Scenario: Empty group
- **WHEN** отчёт содержит периоды с currencies=[]
- **THEN** показано пустое состояние без выдуманных денежных сумм или валюты пространства

#### Scenario: Savings and movements
- **WHEN** деньги переведены между balance и saving
- **THEN** остатки типов и transfer-поля отражены без ложного дохода/расхода и двойного учёта
- **THEN** существующие правила представления графиков, валют и загрузки сохраняются

#### Scenario: Mixed expense currencies
- **WHEN** /expenses/revenue возвращает totalRevenue=null и несколько currencies
- **THEN** показаны независимые суммы валют, а null не трактуется как отсутствие расходов

### Requirement: Origin-aware operation details
Система SHALL сохранять origin и исторические actor-объекты при чтении и показывать автора
в деталях. Для дохода погашения долга SHALL предлагаться переход к долгу вместо обычных
изменения/удаления; расход плана SHALL следовать обычным правилам расхода.

#### Scenario: Anonymized actor
- **WHEN** actor.isAnonymized=true
- **THEN** показана нейтральная подпись «Удалённый пользователь» без запроса личного профиля

#### Scenario: Debt income
- **WHEN** origin у дохода указывает на долг
- **THEN** его нельзя исправить как обычный доход; доступен переход к истории долга с учётом прав

### Requirement: Confirmed mutations and isolated refresh
Система MUST подтверждать удаления, блокировать повторные отправки, сохранять форму при ошибке
и обновлять затронутые счета, историю, отчёты и лимиты исходного бюджета после успеха.
POST финансовых действий SHALL не повторяться автоматически при неопределённом результате.

#### Scenario: Response lost after create
- **WHEN** ответ создания не получен из-за сетевого сбоя
- **THEN** интерфейс предлагает проверить историю перед повтором и не создаёт вторую запись автоматически

#### Scenario: One widget fails
- **WHEN** один запрос пространства завершился ошибкой
- **THEN** другие доступные виджеты сохраняются, а ошибочный показывает локальный повтор без данных другого бюджета

### Requirement: Shared category reference resolution
Система SHALL использовать пригодный общий справочник категорий для расходов и лимитов того же пользователя и пространства без отдельных запросов категории для каждой строки. При отсутствии категории в справочнике или недоступности списка SHALL применяться резервное чтение по ID; одновременные резервные чтения одного ID SHALL объединяться.

#### Scenario: Resolve a complete expense page and limits
- **WHEN** расходы и лимиты одновременно загружаются, а их категории присутствуют в общем справочнике
- **THEN** один запрос справочника обслуживает этих потребителей без отдельных запросов категорий по ID
- **THEN** количество запросов категорий не растёт с количеством строк

#### Scenario: Reuse an available category cache
- **WHEN** пригодный справочник уже закэширован для того же пользователя и пространства
- **THEN** разрешение известных категорий не требует нового HTTP-запроса

#### Scenario: Resolve a missing category once
- **WHEN** несколько расходов или лимитов одновременно ссылаются на один ID, отсутствующий в справочнике
- **THEN** выполняется один общий резервный запрос этой категории в исходном пространстве

#### Scenario: Category list is unavailable
- **WHEN** загрузка справочника не удалась, но отдельная категория доступна по ID
- **THEN** связанные расходы и лимиты разрешают категорию через общий резервный запрос

#### Scenario: Preserve historical archived references
- **WHEN** справочник содержит архивную категорию, на которую ссылается расход или лимит
- **THEN** её метаданные используются для чтения истории независимо от скрытия категории из вариантов выбора

#### Scenario: Preserve unavailable-category handling
- **WHEN** ни справочник, ни резервный запрос не позволяют разрешить категорию
- **THEN** расход остаётся доступен с прежней нейтральной подписью категории и возможностью повторить загрузку
- **THEN** неразрешённый лимит сообщает об ошибке загрузки вместо успешного результата с чужой категорией

#### Scenario: Keep cached references isolated and refreshable
- **WHEN** меняется пользователь или пространство либо данные категорий инвалидированы
- **THEN** данные другого контекста не используются, а устаревший справочник перечитывается для исходного контекста

#### Scenario: Cancel one consumer of shared metadata
- **WHEN** один потребитель отменяет ожидание категории, которую также запрашивает другой потребитель
- **THEN** отменённый потребитель не принимает успешный результат, а общая загрузка остаётся доступной второму
