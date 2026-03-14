# `reactivity.ts`

## Purpose

This module implements the core reactive runtime of `@nrgyjs/core`: atom
creation, computed atoms, effects, and the runtime that propagates changes.

## Overview

This file defines the behavior of `atom()`, `compute()`, `effect()`,
`syncEffect()`, `combineAtoms()`, and helper APIs such as `isAtom()` and
`getAtomLabel()`. All higher-level parts of the package, including `Scope`,
MVC/MVVM, and adjacent integrations, rely on this runtime.

## Conceptual Architecture

The internal architecture is built from several layers:

1. Source nodes (`AtomNode`) store current value, version, equality strategy,
   and observer references.
2. Computed nodes (`ComputedNode`) evaluate lazily and track dependencies
   through `RUNTIME.activeObserver`.
3. Effect nodes (`EffectNode`) subscribe to sources and are scheduled through
   synchronous or microtask schedulers.
4. `Runtime` manages batch state, the active observer, and three execution
   queues: sync, async, and microtask.
5. Helper APIs such as `combineAtoms()` and `isAtom()` are built on top of the
   low-level primitives.

This design supports lazy derivations, deterministic propagation, and explicit
control over deferred effects.

## Public API Description

### `atom<T>(initialValue, options?): SourceAtom<T>`

- `initialValue`: initial source value.
- `options`: `label`, `equal`, and `onDestroy`.
- Returns a writable atom with `set`, `update`, `mutate`, `destroy`, and
  `withUpdates`.

### `compute<T>(computation, options?): Atom<T>`

- `computation`: pure function deriving a value from other atoms.
- `options`: `label` and `equal`.
- Returns a read-only computed atom.

### `effect(source, callback, options?): EffectSubscription`

- `source`: one atom or a list of atoms.
- `callback`: change handler.
- `options`: scheduling and error-handling options.
- Creates an asynchronous effect and returns a subscription with `destroy()`.

### `syncEffect(source, callback, options?): EffectSubscription`

- Equivalent to `effect()`, but scheduled synchronously inside the runtime.

### `combineAtoms<TValues>(sources): Atom<TValues>`

- Accepts a tuple of atoms.
- Returns a computed atom that reads all source values.

### `isAtom(value): boolean`

- Checks whether a value implements the Atom API contract.

### `getAtomLabel(source): string | undefined`

- Returns the atom label, if one was assigned.

## Usage Examples

```ts
import { atom, compute, effect } from '@nrgyjs/core';

const price = atom(10);
const quantity = atom(2);
const total = compute(() => price() * quantity(), { label: 'total' });

const subscription = effect(total, (value) => {
  console.log('Total:', value);
});

price.set(12);
subscription.destroy();
```

```ts
import { atom, combineAtoms } from '@nrgyjs/core';

const first = atom('A');
const second = atom('B');
const both = combineAtoms([first, second]);

console.log(both()); // ['A', 'B']
```

---

Translation: EN | [RU](./reactivity.ru.md)
