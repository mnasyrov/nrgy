# `flushMicrotasks.ts`

## Назначение файла

Модуль предоставляет `flushMicrotasks()`, небольшой тестовый helper для
ожидания завершения текущего цикла microtask и следующего timer-turn.

## Общая информация

Helper используется в тестах, которым нужно дождаться отложенной работы,
запланированной runtime, React или browser-like окружением. Он дает простой
promise-API без необходимости повторять детали планирования в каждом тесте.

## Концептуальная архитектура

`flushMicrotasks()` возвращает promise, который резолвится через
`setTimeout(resolve, 0)`. Это переводит выполнение в следующий macrotask-turn,
к моменту которого microtask'и текущего цикла уже завершились.

## Описание публичного API

### `flushMicrotasks(): Promise<void>`

- Возвращает promise, который завершается на следующем timer-turn.
- Предназначен для синхронизации тестов, а не для production-логики.

## Примеры использования

```ts
import { flushMicrotasks } from './flushMicrotasks';

await flushMicrotasks();
```

