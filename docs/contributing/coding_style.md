# Coding Style

## Purpose

This guide captures project-specific patterns that recur across the Nrgy.js
codebase. General TypeScript and formatting rules are handled by `tsconfig`
and Biome — they are not repeated here.

For documentation rules see
[docs_requirements.md](./docs_requirements.md).

## Formatting and Language

- Formatting is enforced by Biome — run `npm run format`. Do not hand-tweak
  whitespace.
- TypeScript runs in `strict` mode. Type-check with `npm run check`.
- Prefer named exports for public APIs.

## Pattern: Lifecycle Through `Scope`

Anything that owns a resource (atom, effect, subscription, child controller)
should attach it to a `Scope`. The scope's `destroy()` is the single teardown
point. Do not invent ad-hoc cleanup arrays or boolean flags.

```ts
import { createScope } from '@nrgyjs/core';

const scope = createScope();

const value = scope.atom(0);                 // collected for disposal
scope.effect(value, (v) => console.log(v));  // unsubscribed on destroy
scope.onDestroy(() => closeSocket(socket));  // arbitrary teardown

scope.destroy();                             // disposes everything above
```

- `scope.atom`, `scope.effect`, `scope.syncEffect` create and register at the
  same time. Prefer these over `atom(...)` followed by manual cleanup.
- `scope.add(resource)` adopts an existing `{ unsubscribe }` /
  `{ destroy }` / `Scope`.
- `destroy()` is idempotent; calling it twice is not an error.

## Pattern: Controllers via `declareController`

Business logic lives in controllers. A controller declaration receives a
context (`{ scope, params }`) and returns the public service. The returned
`destroy()` is supplied automatically from the scope unless you override it.

```ts
import { declareController } from '@nrgyjs/core';

const CounterController = declareController<{ value: () => number }>(
  ({ scope }) => {
    const value = scope.atom(0);

    return {
      value,
      increase: () => value.update((prev) => prev + 1),
    };
  },
);

const counter = new CounterController();
counter.increase();
counter.destroy();
```

- Allocate all reactive state through the controller's `scope` so it tears
  down with the controller.
- Do not return raw mutable objects from a controller — expose atoms (for
  reading) and methods (for writing).
- Public surface is the returned service plus the automatic `destroy()`. Do
  not add a separate `dispose()` or `close()`.

## Pattern: Keep `@nrgyjs/core` Framework-Agnostic

`@nrgyjs/core` must not depend on React, RxJS, DOM globals, or any other
runtime. Framework integration lives in `@nrgyjs/react`, `@nrgyjs/rxjs`,
`@nrgyjs/rx-effects`, and the `ditox` packages.

- A new abstraction that needs `window`, JSX, or `Observable` goes into the
  appropriate integration package — not into core.
- If a feature can be expressed with atoms, effects, and scopes, it belongs
  in core. If it needs framework lifecycles, it does not.

## Pattern: Tests Around Observable Behavior

Tests use Vitest, are colocated next to source files
(`foo.ts` ↔ `foo.test.ts`), and assert externally visible behavior. They
should explicitly cover destruction paths, because lifecycle bugs do not
surface from happy-path tests.

```ts
import { describe, expect, it, vi } from 'vitest';
import { createScope } from './createScope';
import { atom } from '../reactivity/reactivity';

describe('createScope()', () => {
  it('disposes collected atoms on destroy', () => {
    const scope = createScope();
    const value = scope.add(atom(1));

    scope.destroy();
    value.set(2);

    expect(value()).toBe(1); // post-destroy writes are no-ops
  });

  it('runs registered teardown exactly once', () => {
    const scope = createScope();
    const teardown = vi.fn();

    scope.onDestroy(teardown);
    scope.destroy();
    scope.destroy(); // idempotent

    expect(teardown).toHaveBeenCalledTimes(1);
  });
});
```

- Name tests after the observed behavior, not the implementation
  (`disposes collected atoms on destroy`, not `calls subscriptions.next`).
- For schedulers and effects, prefer `runEffects()` over `setTimeout` /
  `await` to keep tests deterministic.

## Pattern: Minimal Comments, Useful When Present

- Prefer self-explanatory names and small functions over comments.
- A comment is justified when the *why* is non-obvious — a hidden invariant,
  a workaround for an upstream bug, a tricky lifecycle constraint. Do not
  describe *what* the code already says.
