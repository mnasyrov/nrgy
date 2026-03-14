# `queueMicrotask.ts`

## Назначение файла

Модуль предоставляет нормализованную функцию постановки задач в microtask для
окружений, где `globalThis.queueMicrotask` может отсутствовать.

## Общая информация

Реактивный runtime зависит от microtask-выполнения для отложенных lifecycle-
событий и асинхронных эффектов. `nrgyQueueMicrotask` дает runtime стабильную
функцию планирования вне зависимости от поддержки платформы.

## Концептуальная архитектура

Модуль состоит из двух слоев:

1. `queueMicrotaskPolyfill`, который планирует работу через `Promise.resolve()`.
2. `nrgyQueueMicrotask`, который предпочитает нативный
   `globalThis.queueMicrotask`, а при его отсутствии использует polyfill.

Так runtime получает переносимое планирование без внешних шима-зависимостей.

## Описание публичного API

### `type QueueMicrotaskFn = (callback: () => void) => void`

- Тип функции для постановки callback в очередь microtask.

### `queueMicrotaskPolyfill: QueueMicrotaskFn`

- Polyfill-реализация на основе resolved promise.

### `nrgyQueueMicrotask: QueueMicrotaskFn`

- Предпочтительная функция постановки microtask, используемая runtime.

## Примеры использования

```ts
import { nrgyQueueMicrotask } from './queueMicrotask';

nrgyQueueMicrotask(() => {
  console.log('microtask');
});
```

