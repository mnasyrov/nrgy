# `createScope.ts`

## Purpose

This module implements `createScope()`, which creates a `Scope` object for
managing the lifecycle of destroyable resources, effects, and atoms.

## Overview

`Scope` acts as a boundary for business logic. It collects created or attached
resources and guarantees centralized cleanup through a single `destroy()` call.
This is critical for controllers, view models, and deterministic tests.

## Conceptual Architecture

The implementation is based on a linked list of teardown handlers:

1. `onDestroy()` registers a callback, unsubscribable resource, or destroyable
   resource.
2. `add()` attaches an external resource to the scope.
3. `atom()`, `effect()`, `syncEffect()`, and `createScope()` create child
   entities and immediately register them in the current scope.
4. `destroyScope()` walks the registered teardowns in reverse registration
   order and collects errors.
5. If errors occur, `ScopeDestructionError` is thrown.

This makes `Scope` a simple ownership container for reactive resources.

## Public API Description

### `createScope(): Scope`

- Returns a new `Scope` instance.
- Lets callers register resources through `onDestroy()` and `add()`.
- Provides convenience factories `atom`, `effect`, `syncEffect`, and
  `createScope`.

## Usage Examples

```ts
import { createScope } from '@nrgyjs/core';

const scope = createScope();
const counter = scope.atom(0);

scope.onDestroy(() => {
  console.log('scope destroyed');
});

counter.set(1);
scope.destroy();
```

---

Translation: EN | [RU](./createScope.ru.md)
