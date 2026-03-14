# Lifecycle, Batch, and Scheduling

## Purpose

This page explains how Nrgy.js handles cleanup, coordinated updates, and
reaction timing.

## Scope

A `Scope` owns disposable resources such as effects, child scopes, atoms, and
custom teardown callbacks.

```ts
import { createScope } from '@nrgyjs/core';

const scope = createScope();
const count = scope.atom(0);

scope.effect(count, (value) => {
  console.log(value);
});

scope.destroy();
```

Why scopes matter:

- they make lifetime explicit
- they group reactive resources
- they reduce leaked subscriptions
- they fit naturally into controller lifecycles

What a scope can collect:

- subscriptions returned by `effect()` or `syncEffect()`
- atoms created through `scope.atom()`
- child scopes created through `scope.createScope()`
- arbitrary destroyable or unsubscribable resources passed through `scope.add()`
- custom cleanup callbacks registered through `onDestroy`

When a scope is destroyed, its owned resources are destroyed or unsubscribed in
one place. This is the main mechanism for feature-level cleanup.

## Destroy and Cleanup

Cleanup is a first-class concern in Nrgy.js. Here cleanup means releasing
resources: subscriptions, timers, sockets, long-lived state, and other objects
that should not stay alive after the owning feature is gone.

Recommended practices:

- destroy controllers when the owning feature ends
- destroy atoms that hold large data and outlive local references
- register external subscriptions and sockets in scope cleanup
- use `onDestroy` for resource release, not for core business logic

Cleanup is especially important when:

- the atom holds large objects, caches, or binary data
- a feature creates timers, sockets, or external subscriptions
- a controller outlives one render but not the whole application
- state is shared broadly and can remain reachable after a screen is gone

Memory cleanup is the developer's responsibility when long-lived objects are
involved.

## Batch

`batch()` pauses effect execution until a group of updates is complete.

```ts
import { atom, batch } from '@nrgyjs/core';

const firstName = atom('Ada');
const lastName = atom('Lovelace');

batch(() => {
  firstName.set('Grace');
  lastName.set('Hopper');
});
```

Use `batch()` when:

- several fields form one logical state transition
- observers should only see the final consistent state
- multiple writes would otherwise trigger redundant reactions

## Scheduling

This is a key design choice: effects are not all treated as immediate
synchronous callbacks.

Practical implications:

- Nrgy.js conceptually works with two queues: synchronous reactions and deferred
  reactions
- normal `effect()` is typically deferred
- `syncEffect()` is available for synchronous observation
- batching works naturally with deferred reactions
- reaction timing is part of the API contract and must be understood
- deferred effects usually run after the current synchronous work, which maps to
  microtask-like behavior from the user's point of view

This model helps avoid inconsistent intermediate states and reduces the need
for manual coordination.

Why effects may not run immediately:

- several state writes can happen in one synchronous flow
- deferred execution lets the runtime observe the final stable values
- this reduces accidental work on intermediate states
- it lowers the need for manual batching in common cases

## Constraints and Invariants

Keep these rules in mind:

- `compute()` must stay pure
- state writes belong in actions, effects, or explicit mutation points
- side effects belong in `effect()` or controller actions, not in pure
  derivations
- cleanup ownership should be visible from the code that creates resources
- `syncEffect()` is an opt-in tool, not the default reaction model

Typical mistakes:

- writing to atoms from inside `compute()`
- hiding cleanup behind implicit global ownership
- keeping a large state alive after the owning feature is gone
- mixing derivation, mutation, and I/O in one reactive expression

## Checklist

- Put cleanup strategy next to creation.
- Prefer normal `effect()` unless you need strict sync semantics.
- Use `batch()` for multi-field updates.
- Keep derived logic pure and move workflows into controllers.
