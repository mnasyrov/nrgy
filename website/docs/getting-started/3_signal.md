---
sidebar_position: 3
---

# Create Signal

Signal works similar to Atom but it does not keep a state. Signal allows to use
"publisher-consumer" or "event emitter" pattern.

## Create your first Signal

```ts
import { effect, signal } from 'nrgy';

const onValue = signal<number>();

// Subscribe in asynchronous mode
effect(onValue, (value) => console.log(`listener1: ${value}`));
effect(onValue, (value) => console.log(`listener2: ${value}`));

// Emit an event
onValue(2);

// Console output after some time:
// listener1: 2
// listener2: 2
```
