# `viewProxy.ts`

## Назначение файла

Модуль реализует `ViewProxy` и функцию `createViewProxy()`, которые представляют
view binding как управляемый программно объект.

## Общая информация

`ViewProxy` особенно полезен для тестов и интеграционных адаптеров. Он
эмулирует поведение представления: хранит props как атомы, отслеживает статус
mount/update/unmount и рассылает lifecycle-события слушателям.

## Концептуальная архитектура

Реализация состоит из следующих частей:

1. Атом `status` хранит текущее состояние представления.
2. Для каждого initial prop создается source-атом, а наружу публикуется его
   read-only версия.
3. Три `Emitter`-экземпляра отвечают за события `mount`, `update`, `unmount`.
4. Локальный `Scope` владеет atom-ресурсами props и уничтожается в `destroy()`.

Методы `mount()`, `update()`, `unmount()` и `destroy()` синхронизируют
внутреннее состояние и уведомляют подписчиков.

## Описание публичного API

### `type ViewProxy<TProps>`

- Расширяет `ViewBinding<TProps>`.
- Добавляет методы `mount()`, `update(props?)`, `unmount()`, `destroy()`.

### `createViewProxy(): ViewProxy<Record<string, never>>`

- Создает proxy без initial props.

### `createViewProxy<TProps>(initialProps: TProps): ViewProxy<TProps>`

- `initialProps`: начальные props представления.
- Возвращает объект `ViewProxy<TProps>`.

## Примеры использования

```ts
import { createViewProxy } from '@nrgyjs/core';

const view = createViewProxy({ id: '42' });

view.onMount(() => {
  console.log(view.props.id());
});

view.mount();
view.update({ id: '43' });
view.destroy();
```
