# `schedulers.ts`

## Purpose

This module implements the low-level task schedulers used by the Nrgy reactive
runtime.

## Overview

Effects and deferred runtime callbacks need deterministic scheduling behavior.
This file provides a common `TaskScheduler` contract together with synchronous
and microtask-based implementations built on the internal ring buffer queue.

## Conceptual Architecture

The module exposes one shared scheduler interface and two concrete strategies:

1. `createMicrotaskScheduler()` stores tasks in a ring buffer and schedules
   execution through `nrgyQueueMicrotask`.
2. `createSyncTaskScheduler()` stores tasks in the same kind of queue but runs
   them immediately when possible.
3. Both schedulers support pause/resume semantics, which the runtime uses to
   implement batching.

This separation allows the runtime to handle synchronous effects, asynchronous
effects, and controller lifecycle callbacks uniformly.

## Public API Description

### `type TaskScheduler<Task>`

- `isEmpty()`: checks whether the queue has pending tasks.
- `schedule(task)`: enqueues a task.
- `execute()`: drains the queue.
- `pause()`: temporarily suspends execution.
- `resume()`: re-enables execution and continues draining queued tasks.

### `createMicrotaskScheduler<Task>(taskExecutor): TaskScheduler<Task>`

- Creates a scheduler that flushes through the microtask queue.

### `createSyncTaskScheduler<Task>(taskExecutor): TaskScheduler<Task>`

- Creates a scheduler that flushes synchronously.

## Usage Examples

```ts
import { createSyncTaskScheduler } from './schedulers';

const scheduler = createSyncTaskScheduler<number>((task) => {
  console.log(task);
});

scheduler.schedule(1);
```

---

Translation: EN | [RU](./schedulers.ru.md)
