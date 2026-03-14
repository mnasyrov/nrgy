# `emitter.ts`

## Purpose

This module provides a minimal internal event emitter used by `@nrgyjs/core`
for lightweight lifecycle notifications.

## Overview

`Emitter<T>` is intentionally small and dependency-free. It is used in places
where the runtime needs a simple subscribe/emit/destroy primitive without
pulling in external event systems or Rx-style abstractions.

## Conceptual Architecture

The implementation is built around a `Set` of listeners:

1. `subscribe()` registers a listener and returns a small teardown object.
2. `emit(value)` iterates over the current listener set and invokes each
   callback.
3. `destroy()` clears all listeners at once.

The module is marked internal and is primarily consumed by `ViewProxy` and
other runtime helpers.

## Public API Description

### `type Listener<T> = (value: T) => void`

- Generic callback type for emitted values.

### `type EmitterSubscription = { destroy: () => void }`

- Small teardown contract returned by `subscribe()`.

### `class Emitter<T>`

- `subscribe(listener)`: registers a listener and returns a subscription.
- `emit(value)`: broadcasts a value to all listeners.
- `destroy()`: removes all registered listeners.

## Usage Examples

```ts
import { Emitter } from './emitter';

const emitter = new Emitter<number>();
const subscription = emitter.subscribe((value) => {
  console.log(value);
});

emitter.emit(1);
subscription.destroy();
emitter.destroy();
```

---

Translation: EN | [RU](./emitter.ru.md)
