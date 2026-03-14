# `schedulers.ts`

## Назначение файла

Модуль реализует низкоуровневые task scheduler'ы, используемые реактивным
runtime Nrgy.

## Общая информация

Эффекты и отложенные runtime-callback'и требуют детерминированного поведения
при планировании. Этот файл предоставляет общий контракт `TaskScheduler`, а
также синхронную и microtask-ориентированную реализации, построенные поверх
внутренней ring-buffer очереди.

## Концептуальная архитектура

Модуль экспортирует один общий интерфейс scheduler'а и две конкретные
стратегии:

1. `createMicrotaskScheduler()` хранит задачи в ring buffer и планирует
   исполнение через `nrgyQueueMicrotask`.
2. `createSyncTaskScheduler()` использует такую же очередь, но исполняет задачи
   сразу, когда это возможно.
3. Оба scheduler'а поддерживают `pause()/resume()`, которые runtime использует
   для реализации batching.

Это разделение позволяет единообразно обрабатывать sync-эффекты,
async-эффекты и lifecycle-callback'и контроллеров.

## Описание публичного API

### `type TaskScheduler<Task>`

- `isEmpty()`: проверяет, есть ли задачи в очереди.
- `schedule(task)`: ставит задачу в очередь.
- `execute()`: дренирует очередь.
- `pause()`: временно приостанавливает исполнение.
- `resume()`: возобновляет исполнение и продолжает обработку накопленных задач.

### `createMicrotaskScheduler<Task>(taskExecutor): TaskScheduler<Task>`

- Создает scheduler с выполнением через очередь microtask.

### `createSyncTaskScheduler<Task>(taskExecutor): TaskScheduler<Task>`

- Создает scheduler с синхронным выполнением.

## Примеры использования

```ts
import { createSyncTaskScheduler } from './schedulers';

const scheduler = createSyncTaskScheduler<number>((task) => {
  console.log(task);
});

scheduler.schedule(1);
```

