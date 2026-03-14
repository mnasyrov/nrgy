# `view.ts`

## Purpose

This module defines view-related types and the contracts used to bind a
controller to a UI layer.

## Overview

The file contains no runtime logic, but it defines the public types used by
`withView()`, `createViewProxy()`, and React integrations. Through these
contracts, a controller receives view props as atoms together with lifecycle
signals.

## Conceptual Architecture

The module separates view concerns into three concepts:

1. `ViewProps`: input props of an arbitrary view.
2. `ViewPropAtoms<TProps>`: reactive atom-based representation of those props.
3. `ViewBinding<TProps>`: contract for `mount`, `update`, `unmount`, together
   with `props` and `status`.

This allows UI adapters to describe lifecycle changes independently of any
specific framework.

## Public API Description

### `ViewProps`

- Alias for `Record<string, unknown>`.
- Defines the baseline shape of view props.

### `ViewPropAtoms<TProps>`

- Converts a props object into an object of atoms with the same keys.

### `ViewStatus`

- One of `'unmounted'`, `'mounted'`, or `'destroyed'`.

### `ViewStatuses`

- Constant object containing the supported `ViewStatus` values.

### `ViewBinding<TProps>`

- `props`: atom-backed view props.
- `status`: atom with the current view status.
- `onMount(listener)`, `onUpdate(listener)`, `onUnmount(listener)`: lifecycle
  subscriptions.

## Usage Examples

```ts
import type { ViewBinding } from '@nrgyjs/core';

type UserProps = { id: string };

function bindView(view: ViewBinding<UserProps>) {
  view.onMount(() => {
    console.log(view.props.id());
  });
}
```

---

Translation: EN | [RU](./view.ru.md)
