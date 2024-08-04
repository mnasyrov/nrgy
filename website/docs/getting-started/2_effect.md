---
sidebar_position: 2
---

# Create Effect

Use effect to subscribe on atom changes. This is the place to perform side
effects. The effect is called once per a state change.

## Subscribe on Atom

By default, the effect is asynchronous - it is called in the next microtask
after a state change.

```ts
import { atom, effect } from 'nrgy';

const counter = atom<number>(1);

// Subscribe in asynchronous mode
effect(counter, (value) => console.log(value));

counter.set(2);

setTimeout(() => counter.set(3), 100);

// Console output after some time:
// 2
// 3
```

## Subscribe in synchronous mode

It is possible to make synchronous subscription - the effect will be invoked
during updating an atom.

```ts
import { atom, syncEffect } from 'nrgy';

const counter = atom<number>(1);

// Subscribe
syncEffect(counter, (value) => console.log(value));
// Console: 1

counter.set(2);
// Console: 2

setTimeout(() => {
  counter.set(3);
  // Console: 3
}, 100);
```
