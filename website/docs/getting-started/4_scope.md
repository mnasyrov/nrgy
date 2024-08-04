---
sidebar_position: 4
---

# Using Scope

The scope tracks subscriptions and resources and allow to destroy them when they
are not needed.

```ts
import { scope } from 'nrgy';
import { Subject } from 'rxjs';

// Create the scope
const scope = createScope();

// Use built-in helpers for core components
const counter = scope.atom<number>(1);
const onValue = scope.signal<number>();
scope.effect(counter, onValue);
scope.effect(onValue, (value) => console.log(value));

// Register some destroyable resource
const someRxObservable = new Subject();
scope.add(
  someRxObservable.subscribe(() => {
    console.log();
  }),
);

// Register a callback to be called on scope destruction
scope.onDestroy(() => console.log('The scope is destroyed'));

// Destroy the scope
scope.destroy();
```
