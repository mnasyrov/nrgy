# Atoms, Computed, and Effects

## Purpose

This page documents the three primitives you will use most often in Nrgy.js.

## Atom

An `atom()` stores mutable reactive state.

```ts
import { atom } from '@nrgyjs/core';

const userName = atom('Alice', { label: 'userName' });

userName.set('Bob');
userName.update((value) => value.trim());
```

You can also customize equality and cleanup behavior:

```ts
import { atom } from '@nrgyjs/core';

const user = atom(
  { id: '1', name: 'Alice' },
  {
    equal: (a, b) => a.id === b.id && a.name === b.name,
    onDestroy: () => {
      console.log('user atom destroyed');
    },
  },
);
```

Important properties:

- An atom is a function. Call it to read the current value.
- A source atom exposes `set()`, `update()`, `mutate()`, and `destroy()`.
- `withUpdates()` lets you define named update helpers on top of the atom.
- Equality can be customized through `equal`.
- Cleanup can be attached through `onDestroy`.

Use an atom for state that changes over time and must be observed by other
parts of the system.

If several updates form a stable API, `withUpdates()` can make them explicit:

```ts
const count = atom(0).withUpdates({
  increase: (value, step: number = 1) => value + step,
  decrease: (value, step: number = 1) => value - step,
});

count.updates.increase();
count.updates.decrease(2);
```

## Compute

`compute()` creates a derived atom from other atoms.

```ts
import { atom, compute } from '@nrgyjs/core';

const price = atom(100);
const quantity = atom(2);
const total = compute(() => price() * quantity(), { label: 'total' });
```

`compute()` uses dynamic dependency tracking. It subscribes to the atoms that
are actually read while the computation runs.

```ts
const mode = atom<'price' | 'quantity'>('price');
const selected = compute(() => {
  return mode() === 'price' ? price() : quantity();
});
```

In this example, the active dependency can change between runs. That is why the
computation must stay pure and deterministic.

Rules for computed expressions:

- Keep them pure.
- Do not write to atoms inside a computation.
- Keep them fast.
- Avoid heavy sorting or large transformations if the result can be cached in a
  different layer.

Computed atoms are a place for deterministic value derivation, not for workflow
execution.

Why state writes are forbidden inside `compute()`:

- it breaks the separation between derivation and effects
- it can create unstable or cyclic update graphs
- it makes dependency tracking harder to reason about
- it turns a pure read phase into hidden workflow execution

## Effect

`effect()` reacts to changes in atoms or computed atoms.

```ts
import { atom, effect } from '@nrgyjs/core';

const count = atom(0);

const subscription = effect(count, (value) => {
  console.log('Count changed:', value);
});

count.set(1);
subscription.destroy();
```

By default, `effect()` is deferred. `syncEffect()` runs in the synchronous
queue.

```ts
import { atom, effect, syncEffect } from '@nrgyjs/core';

const value = atom(0);

effect(value, (next) => {
  console.log('deferred', next);
});

syncEffect(value, (next) => {
  console.log('sync', next);
});

value.set(1);
```

Use `effect()` for:

- logging
- synchronization with external systems
- triggering async work
- updating UI adapters

Use `syncEffect()` only when you need synchronous observation and clearly
understand the ordering requirements.

Execution model:

- creating an effect usually triggers an initial run so the subscriber sees the
  current value
- `effect()` is usually observed after the current synchronous update flow
- `syncEffect()` reacts in the synchronous queue
- batched updates let deferred effects observe the final consistent state
- the first effect run is part of subscription setup unless effect options say
  otherwise

## Reading Guidelines

Ask these questions when choosing a primitive:

- Is this mutable state? Use `atom()`.
- Is this a pure derivation? Use `compute()`.
- Is this a reaction with side effects? Use `effect()`.

## Common Mistakes

- Writing state from inside `compute()`.
- Treating `compute()` as a place for async workflows.
- Keeping large objects alive without destruction strategy.
- Using effects as a replacement for domain modeling.
- Using `syncEffect()` by default without real ordering requirements.
- Encoding too much workflow directly in UI code instead of controllers.
