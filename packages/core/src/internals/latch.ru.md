# `latch.ts`

## Назначение файла

Модуль предоставляет `Latch<T>` и `createLatch()`, внутренний примитив
синхронизации для координации асинхронной работы.

## Общая информация

Latch реализован как `Promise`, у которого наружу экспортируются функции
`resolve()` и `reject()`. Такой паттерн удобен в тестах и runtime-helper'ах,
где нужно дождаться события, но завершить promise из внешнего кода.

## Концептуальная архитектура

`createLatch()` собирает небольшой объект в два шага:

1. Создает `Promise<T>`.
2. Сохраняет promise вместе с захваченными callback'ами `resolve` и `reject`
   в едином возвращаемом объекте.

Примитив намеренно минималистичен и остается внутренним.

## Описание публичного API

### `type Latch<T>`

- `promise`: promise, который будет завершен позже.
- `resolve(value)`: успешно завершает promise.
- `reject(reason?)`: завершает promise ошибкой.

### `createLatch<T = void>(): Latch<T>`

- Создает новый latch-объект с доступными callback'ами завершения.

## Примеры использования

```ts
import { createLatch } from './latch';

const latch = createLatch<number>();
setTimeout(() => latch.resolve(42), 0);

await latch.promise;
```

