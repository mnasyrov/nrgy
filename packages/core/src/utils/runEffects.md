# `runEffects.ts`

## Purpose

This module provides `runEffects()`, which forces execution of all effects that
have already been queued by the runtime.

## Overview

The utility is especially useful in tests and synchronous integration scenarios
where callers do not want to wait for the natural microtask turn and instead
want to flush Nrgy schedulers explicitly.

## Conceptual Architecture

`runEffects()` is a thin wrapper over `RUNTIME.runEffects()`. Internally, the
runtime executes:

- the synchronous effect queue;
- the asynchronous effect queue;
- the microtask callback queue.

This makes the function a convenient entry point for deterministic completion
of deferred reactive work.

## Public API Description

### `runEffects(): void`

- Accepts no arguments.
- Executes all queued runtime effects and callbacks.

## Usage Examples

```ts
import { atom, effect, runEffects } from '@nrgyjs/core';

const value = atom(0);
effect(value, (next) => {
  console.log(next);
});

value.set(1);
runEffects();
```

---

Translation: EN | [RU](./runEffects.ru.md)
