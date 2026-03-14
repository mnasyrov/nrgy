# `latch.ts`

## Purpose

This module provides `Latch<T>` and `createLatch()`, an internal synchronization
primitive for coordinating asynchronous work.

## Overview

A latch is implemented as a promise whose `resolve()` and `reject()` functions
are exposed to the caller. This pattern is useful in tests and runtime helpers
that need to await an event while resolving it from outside the promise
constructor.

## Conceptual Architecture

`createLatch()` builds a small object in two steps:

1. It creates a `Promise<T>`.
2. It stores the promise together with the captured `resolve` and `reject`
   callbacks in a single returned object.

The primitive is intentionally minimal and internal.

## Public API Description

### `type Latch<T>`

- `promise`: promise that will settle later.
- `resolve(value)`: resolves the promise.
- `reject(reason?)`: rejects the promise.

### `createLatch<T = void>(): Latch<T>`

- Creates a new latch object with exposed settlement callbacks.

## Usage Examples

```ts
import { createLatch } from './latch';

const latch = createLatch<number>();
setTimeout(() => latch.resolve(42), 0);

await latch.promise;
```

