# `scopeDestructionError.ts`

## Purpose

This module defines `ScopeDestructionError`, which signals failures that occur
during cleanup of multiple resources inside a `Scope`.

## Overview

During `scope.destroy()`, teardown callbacks can throw errors. Instead of
losing part of that information, the package aggregates all failures into a
single exception so callers can inspect the complete cleanup result.

## Conceptual Architecture

`ScopeDestructionError` is a thin `Error` subclass with an additional `errors`
field containing the original list of exceptions. It is used by
`createScope.ts` after a full teardown pass completes.

## Public API Description

### `class ScopeDestructionError extends Error`

- `errors`: array of errors raised during resource destruction.
- Used as the aggregate error container for `Scope.destroy()`.

### `new ScopeDestructionError(errors: unknown[])`

- `errors`: the collected source errors.
- Creates an error instance named `ScopeDestructionError`.

## Usage Examples

```ts
import { ScopeDestructionError, createScope } from '@nrgyjs/core';

const scope = createScope();
scope.onDestroy(() => {
  throw new Error('teardown failed');
});

try {
  scope.destroy();
} catch (error) {
  if (error instanceof ScopeDestructionError) {
    console.log(error.errors.length);
  }
}
```

---

Translation: EN | [RU](./scopeDestructionError.ru.md)
