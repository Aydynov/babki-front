# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
