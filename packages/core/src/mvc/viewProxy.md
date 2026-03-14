# `viewProxy.ts`

## Purpose

This module implements `ViewProxy` and `createViewProxy()`, representing a view
binding as a programmatically controlled object.

## Overview

`ViewProxy` is especially useful in tests and adapter layers. It simulates a
view by storing props as atoms, tracking mount/update/unmount status, and
broadcasting lifecycle events to listeners.

## Conceptual Architecture

The implementation consists of several parts:

1. A `status` atom stores the current view state.
2. For each initial prop, a source atom is created while a read-only version is
   exposed publicly.
3. Three `Emitter` instances handle `mount`, `update`, and `unmount` events.
4. A local `Scope` owns the prop atoms and is destroyed in `destroy()`.

Methods `mount()`, `update()`, `unmount()`, and `destroy()` synchronize the
internal state and notify subscribers.

## Public API Description

### `type ViewProxy<TProps>`

- Extends `ViewBinding<TProps>`.
- Adds `mount()`, `update(props?)`, `unmount()`, and `destroy()`.

### `createViewProxy(): ViewProxy<Record<string, never>>`

- Creates a proxy without initial props.

### `createViewProxy<TProps>(initialProps: TProps): ViewProxy<TProps>`

- `initialProps`: initial props of the view.
- Returns a `ViewProxy<TProps>` instance.

## Usage Examples

```ts
import { createViewProxy } from '@nrgyjs/core';

const view = createViewProxy({ id: '42' });

view.onMount(() => {
  console.log(view.props.id());
});

view.mount();
view.update({ id: '43' });
view.destroy();
```
