---
sidebar_position: 1
---

# Create Atom

Use an atom to keep a state.

## Create your first Atom

```ts
import { atom } from 'nrgy';

// Create Atom
const counter = atom<number>(1);

// Getting a value
console.log(counter()); // 1

// Set a new value
counter.set(2);
console.log(counter()); // 2

// Update the current value
counter.update((prev) => prev + 1);
console.log(counter()); // 3
```

## Add reactive computations

Two rules for computations:

1. Functions for reactive computations must be pure functions: it must do not
   call any side effect or modify a state outside.
2. Reactive function might be called several times to detect changes.

```ts
import { atom, compute } from 'nrgy';

const counter = atom<number>(1);

// Create derived computation
const doubled = compute(() => counter() * 2);
const formula = compute(() => counter() + doubled());

console.log(formula()); // 3

// Update
counter.set(2);
console.log(formula()); // 6
```
