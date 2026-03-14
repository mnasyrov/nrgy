# `types.ts`

## Purpose

This module defines the public TypeScript contracts of the `@nrgyjs/core`
reactive API: atoms, effects, options, and related helper interfaces.

## Overview

The file describes the typing model behind `atom()`, `compute()`, `effect()`,
and companion utilities. It is important for consumers who build abstractions
on top of the Nrgy runtime while preserving strict type inference.

## Conceptual Architecture

The types are grouped by role:

1. Value contracts: `Atom<T>`, `DestroyableAtom<T>`, `SourceAtom<T>`.
2. Computation contracts: `Computation<T>`, `ComputeFn`,
   `ComputeOptions<T>`.
3. Effect contracts: `EffectCallback<T>`, `EffectSubscription`, `EffectFn`,
   `EffectOptions`.
4. Collection and update helpers: `AtomList<TValues>`,
   `SourceAtomUpdates<TValue, TUpdates>`.

The module depends on `ATOM_SYMBOL` and `ValueEqualityFn`, but it contains no
runtime behavior.

## Public API Description

### `Atom<T>`

- Zero-argument function returning the current value `T`.
- Marked with the internal `ATOM_SYMBOL` so the runtime can recognize it.

### `DestroyableAtom<T>`

- Extends `Atom<T>` with `destroy()`.

### `SourceAtom<T>`

- Extends `Atom<T>` with `set`, `update`, `mutate`, `destroy`, and
  `withUpdates`.

### `AtomOptions<T>`

- `label`, `equal`, and `onDestroy` options for `atom()`.

### `ComputeOptions<T>`

- `label` and `equal` options for `compute()`.

### `EffectOptions`

- `label`, `sync`, `onError`, `onDestroy`, and `waitChanges`.

### `AtomFn`, `ComputeFn`, `EffectFn`

- Constructor function types for atoms, computations, and effects.

## Usage Examples

```ts
import type { Atom, EffectOptions, SourceAtom } from '@nrgyjs/core';

function connect(source: SourceAtom<number>, observer: (value: number) => void) {
  observer(source());
}

const options: EffectOptions = {
  label: 'logger',
  sync: true,
};
```
