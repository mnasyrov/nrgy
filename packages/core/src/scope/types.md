# `types.ts`

## Purpose

This module defines the `Scope` contracts and the teardown resource types used
around it.

## Overview

The file provides the interfaces through which consumers and internal modules
interact with lifecycle management. These types are used by controllers,
utilities, and external integrations.

## Conceptual Architecture

The module separates resource roles:

- `Unsubscribable` for objects with `unsubscribe()`;
- `Destroyable` for objects with `destroy()`;
- `ScopeTeardown` as a union of functions and resources;
- `Scope` as the main lifecycle container;
- `SharedScope` as a safe public shape without `destroy()`.

These contracts unify cleanup behavior regardless of the concrete resource
implementation.

## Public API Description

### `interface Unsubscribable`

- Requires `unsubscribe(): void`.

### `interface Destroyable`

- Requires `destroy(): void`.

### `type ScopeTeardown`

- Can be `Unsubscribable`, `Destroyable`, or a callback function.

### `interface Scope extends Destroyable`

- Provides `onDestroy`, `add`, `destroy`, `createScope`, `atom`, `effect`, and
  `syncEffect`.

### `type SharedScope`

- Exposes the public `Scope` interface without `destroy`.

## Usage Examples

```ts
import type { Destroyable, ScopeTeardown } from '@nrgyjs/core';

const resource: Destroyable = {
  destroy() {},
};

const teardown: ScopeTeardown = resource;
```

---

Translation: EN | [RU](./types.ru.md)
