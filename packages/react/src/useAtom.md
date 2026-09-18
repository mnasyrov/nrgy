# `useAtom.ts`

## Purpose

This module provides the `useAtom()` React hook, which subscribes a component
to a single reactive `Atom<T>` value.

## Overview

`useAtom()` solves the basic task of reading an Nrgy atom from React. The hook
is built on React's `useSyncExternalStore()`: the atom itself serves as the
snapshot getter, and a synchronous effect notifies React about changes.

Because the value is read from the atom on every render, a change of the
`source` atom itself is visible in the same commit. Updates of the atom are
delivered synchronously: an update inside an event handler or inside `act()`
is rendered without waiting for a microtask, and several updates inside one
handler or inside `batch()` produce a single render.

The hook requires React 18 or newer.

## Conceptual Architecture

The hook has two parts:

1. `subscribe` is memoized with `useCallback()` per `source`. It creates a
   subscription through `syncEffect(source, onStoreChange)` and returns
   `subscription.destroy` as the unsubscribe function.
2. `source` is passed to `useSyncExternalStore()` both as `getSnapshot` and
   as `getServerSnapshot`. Atoms keep their value referentially stable between
   changes, so React can compare snapshots with `Object.is`.

Consequences of this design:

- The `source` atom must be stable between renders. An atom created in the
  render body without memoization causes a new subscription on every render.
- An error thrown by the atom surfaces as a render error and can be handled by
  an error boundary.
- Setting an atom in the render body triggers the React warning about updating
  a component during render.

## Public API Description

### `useAtom<T>(source: Atom<T>): T`

- `source`: atom or computed atom whose value should be observed.
- Returns the current value of the atom as type `T`.
- Re-renders the component synchronously when the value of `source` changes.

## Usage Examples

```tsx
import React from 'react';
import { atom } from '@nrgyjs/core';
import { useAtom } from '@nrgyjs/react';

const counter = atom(0);

export function CounterValue() {
  const value = useAtom(counter);

  return <span>{value}</span>;
}
```
