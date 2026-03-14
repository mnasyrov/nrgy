# Counter

## Task

Create the smallest useful controller-backed feature:

- local state
- one or two actions
- explicit controller lifecycle

## Solution

Use a controller with one atom, expose it as readonly state, and keep all
changes inside explicit actions.

## Code

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

## What to Watch Out For

- expose readonly state to the view
- keep writes inside named actions
- destroy the controller when the feature ends

## Common Mistakes

- exposing writable atoms directly to the UI
- mutating state from random external code
- forgetting to destroy the controller in non-global flows
