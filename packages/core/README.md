# Package @nrgyjs/core

## Package Purpose

The `@nrgyjs/core` package provides the fundamental reactive, scope, and
MVC/MVVM primitives used by the Nrgy.js ecosystem.

## Overview

The package combines several layers:

1. A reactive runtime based on `atom()`, `compute()`, and `effect()`.
2. Scopes for lifecycle and resource ownership.
3. Utility helpers for atom composition and testing.
4. Controller, view, and view-model abstractions for MVC/MVVM patterns.

Most other Nrgy.js packages build on top of these APIs.

## Package Installation

```bash
npm install @nrgyjs/core
```

```bash
yarn add @nrgyjs/core
```

```bash
pnpm add @nrgyjs/core
```

## Conceptual Architecture

`@nrgyjs/core` is organized into several functional areas:

1. `common/*`: reusable equality and type helpers.
2. `reactivity/*`: atom types, runtime, schedulers, and effect execution.
3. `scope/*`: lifecycle boundaries that collect destroyable resources.
4. `utils/*`: helper functions built on top of atoms and effects.
5. `mvc/*`: controller declarations, view bindings, and view-model helpers.

## Feature Documentation

- [defaultEquals](./src/common/defaultEquals.md): Default equality strategy.
- [objectEquals](./src/common/objectEquals.md): Structural equality for plain
  objects.
- [common types](./src/common/types.md): Shared helper types such as
  `ValueEqualityFn`.
- [reactivity](./src/reactivity/reactivity.md): Main atom, compute, and
  effect API.
- [reactivity types](./src/reactivity/types.md): Public types for atoms and
  effects.
- [createScope](./src/scope/createScope.md): Scope lifecycle management.
- [ScopeDestructionError](./src/scope/scopeDestructionError.md): Aggregate
  destruction error.
- [scope types](./src/scope/types.md): Shared scope contracts.
- [createAtomSubject](./src/utils/atomSubject.md): Atom subject with value
  and error channels.
- [batch](./src/utils/batch.md): Batched reactive updates.
- [mapAtom](./src/utils/mapAtom.md): Derived atom transformation.
- [mergeAtoms](./src/utils/mergeAtoms.md): Combine several atoms into one.
- [readonlyAtom](./src/utils/readonlyAtom.md): Read-only atom projection.
- [runEffects](./src/utils/runEffects.md): Manual scheduler flush helper.
- [controller](./src/mvc/controller.md): Controller declarations and
  extensions.
- [view](./src/mvc/view.md): View binding contracts.
- [viewModel](./src/mvc/viewModel.md): View-model declarations.
- [viewProxy](./src/mvc/viewProxy.md): Testable view binding implementation.
- [withView](./src/mvc/withView.md): View extension for controllers.

## Usage Examples

```ts
import { atom, compute, effect } from '@nrgyjs/core';

const count = atom(1);
const doubled = compute(() => count() * 2);

const subscription = effect(doubled, (value) => {
  console.log(value);
});

count.set(2);
subscription.destroy();
```

```ts
import { declareController } from '@nrgyjs/core';

const CounterController = declareController(({ scope }) => {
  const value = scope.atom(0);

  return {
    value,
    increase: () => value.update((prev) => prev + 1),
  };
});

const controller = new CounterController();
controller.increase();
controller.destroy();
```

