# ScrollDialog

Оболочка модального окна на Base UI Dialog и ScrollArea. `Base` управляет открытием,
`Content` задаёт размеры и позиционирование, `Layout` выводит заголовок, крестик,
прокручиваемое содержимое и необязательные действия поверх него.

```tsx
import { ScrollDialog } from '@/shared/ui/scroll-dialog';

<ScrollDialog.Base open={open} onOpenChange={setOpen}>
  <ScrollDialog.Content finalFocus={triggerRef}>
    <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
      <ScrollDialog.Layout
        title="Редактирование записи"
        closeLabel="Закрыть окно"
        onClose={() => setOpen(false)}
        closeDisabled={pending}
        actions={<button type="submit" disabled={pending}>Сохранить</button>}
      >
        {/* Поля или содержимое просмотра */}
      </ScrollDialog.Layout>
    </form>
  </ScrollDialog.Content>
</ScrollDialog.Base>
```

Без формы `Layout` помещается непосредственно в `Content`. Если `actions` отсутствует,
панель и нижний запас для неё не создаются. Не передавайте собственный scroll-контейнер:
Layout уже содержит ScrollArea, сохраняет место для обводки фокуса и заканчивает полосу
прокрутки между заголовком и действиями. Обе панели имеют прозрачный фон и backdrop blur 2 px;
содержимое прокручивается под ними. Высота заголовка учитывается автоматически, включая переносы
на узком экране, чтобы первая строка и фокусируемые поля оставались доступными.

`headerActions` позволяет сохранить действия в заголовке существующих форм.
`closeRef` нужен для управления фокусом при переключении содержимого. Размер окна можно
переопределить через `className` у `Content`, остальные popup-props Base UI, включая
`initialFocus`, `finalFocus` и `ref`, также передаются в `Content`.

Состояния, права, валидация, обработка Escape и блокировка закрытия при сохранении остаются
у вызывающего компонента через `Base.onOpenChange`. `closeDisabled` блокирует только крестик.

Точечная проверка публичного API:

```bash
node --test src/shared/ui/scroll-dialog/scroll-dialog.test.mjs
```
