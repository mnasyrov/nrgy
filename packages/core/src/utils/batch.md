# `batch.ts`

## Purpose

This module provides `batch()`, which groups multiple reactive changes into a
single execution unit.

## Overview

When multiple atoms need to be updated inside one action, `batch()` defers
effect execution until the callback completes. This avoids transient states and
redundant observer notifications.

## Conceptual Architecture

`batch()` is a thin public wrapper around `RUNTIME.batch()`. During execution,
the runtime temporarily pauses sync, async, and microtask queues, then resumes
them after the action is finished.

## Public API Description

### `batch<T>(action: () => T): T`

- `action`: function that performs several updates.
- Returns the result of `action`.
- Guarantees deferred reactive effect execution until the batch block ends.

## Usage Examples

```ts
import { atom, batch, effect } from '@nrgyjs/core';

const a = atom(1);
const b = atom(2);

effect([a, b], ([x, y]) => {
  console.log(x + y);
});

batch(() => {
  a.set(10);
  b.set(20);
});
```

