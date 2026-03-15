# Quick Start

## Purpose

This guide introduces Nrgy.js through one small reactive example and one small
 controller example.

## Mental Model

Nrgy.js has two main layers:

1. A reactive runtime built around `atom()`, `compute()`, and `effect()`.
2. A controller layer for keeping business logic outside of UI components.

You can use the reactive layer on its own, or build controllers and view
models on top of it.

## First Reactive Example

```ts
import { atom, compute, effect } from '@nrgyjs/core';

const count = atom(0, { label: 'count' });
const doubled = compute(() => count() * 2, { label: 'doubled' });

const subscription = effect(doubled, (value) => {
  console.log('Doubled value:', value);
});

count.set(1);
count.set(2);

subscription.destroy();
```

What happens here:

- `atom()` creates writable reactive state.
- `compute()` derives a value from atoms.
- `effect()` reacts to changes and can be disposed.

## First Controller Example

```ts
import { declareController, readonlyAtom } from '@nrgyjs/core';

export const CounterController = declareController(({ scope }) => {
  const count = scope.atom(0, { label: 'count' });

  return {
    state: {
      count: readonlyAtom(count),
    },
    increase: () => count.update((value) => value + 1),
    decrease: () => count.update((value) => value - 1),
  };
});

const controller = new CounterController();

controller.increase();
console.log(controller.state.count());

controller.destroy();
```

What this adds:

- `scope` owns resources created by controller logic.
- The controller exposes a public contract instead of UI-specific state.
- `destroy()` makes lifecycle explicit.

## Using It in React

```tsx
import React from 'react';
import { useAtom, useController } from '@nrgyjs/react';

function CounterScreen() {
  const controller = useController(CounterController);
  const count = useAtom(controller.state.count);

  return (
    <button onClick={controller.increase}>
      Count: {count}
    </button>
  );
}
```

## Recommended Learning Path

1. Learn [Core](./core/README.md) primitives.
2. Understand [Architecture](./architecture/README.md).
3. Move to [MVVM and Controllers](./mvvm/README.md).
4. Use [Integrations](./integrations/README.md) and
   [Recipes](./recipes/README.md) for production code.
