# Cleanup of Long-Lived State

## Task

Make sure long-lived state and resources do not remain alive after the owning
feature is gone.

## Solution

Attach cleanup to destruction points and explicitly clear state that can stay
reachable for too long.

## Code

```ts
import { compute, declareController, readonlyAtom } from '@nrgyjs/core';

export const SessionController = declareController(({ scope }) => {
  const cache = scope.atom<Map<string, string>>(new Map(), {
    onDestroy: () => {
      console.log('cache destroyed');
    },
  });

  scope.onDestroy(() => {
    cache.mutate((map) => {
      map.clear();
    });
  });

  const cacheSize = compute(() => cache().size);

  return {
    state: {
      cacheSize: readonlyAtom(cacheSize),
    },
    put: (key: string, value: string) => {
      cache.mutate((map) => {
        map.set(key, value);
      });
    },
  };
});
```

## What to Watch Out For

- long-lived state needs explicit ownership
- destruction may need both resource release and value clearing
- timers, sockets, and subscriptions should be registered in cleanup as well
- clearing a `Map` or similar container in place is often better than replacing
  it with a new value
- if the atom owns the resource directly, cleanup can also live in the atom
  `onDestroy` callback

## Common Mistakes

- assuming large state will disappear automatically
- forgetting to clear data that remains reachable through shared references
- releasing only subscriptions while leaving big caches in memory
