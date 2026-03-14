# `queueMicrotask.ts`

## Purpose

This module provides a normalized microtask scheduling function for environments
that may or may not expose `globalThis.queueMicrotask`.

## Overview

The reactive runtime depends on microtask execution for deferred lifecycle
events and asynchronous effects. `nrgyQueueMicrotask` gives the runtime a
stable scheduling function regardless of platform support.

## Conceptual Architecture

The module has two layers:

1. `queueMicrotaskPolyfill`, which schedules work with `Promise.resolve()`.
2. `nrgyQueueMicrotask`, which prefers the native `globalThis.queueMicrotask`
   implementation and falls back to the polyfill otherwise.

This keeps runtime scheduling portable without depending on external shims.

## Public API Description

### `type QueueMicrotaskFn = (callback: () => void) => void`

- Function type for scheduling a microtask callback.

### `queueMicrotaskPolyfill: QueueMicrotaskFn`

- Polyfill implementation based on resolved promises.

### `nrgyQueueMicrotask: QueueMicrotaskFn`

- Preferred microtask scheduling function used by the runtime.

## Usage Examples

```ts
import { nrgyQueueMicrotask } from './queueMicrotask';

nrgyQueueMicrotask(() => {
  console.log('microtask');
});
```

---

Translation: EN | [RU](./queueMicrotask.ru.md)
