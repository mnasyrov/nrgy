# Migration

## Purpose

This page explains how to migrate from the legacy `nrgy` package line, such as
`nrgy@0.0.46`, to the current `@nrgyjs/*` package structure and API.

## What Changed in the New Version

The migration is not only about renamed imports. The package model and the
preferred architecture both changed.

Main changes:

- the old monolithic `nrgy` package was split into scoped packages:
  `@nrgyjs/core`, `@nrgyjs/react`, `@nrgyjs/ditox`,
  `@nrgyjs/ditox-react`, `@nrgyjs/rxjs`, and `@nrgyjs/rx-effects`
- MVC/MVVM APIs now live primarily in `@nrgyjs/core` and `@nrgyjs/react`
- the preferred model is clearer controller or view-model driven logic with
  explicit lifecycle and cleanup
- old store-oriented and effect-state oriented patterns are no longer the
  preferred direction for new code

From `nrgy@0.0.46`, the most visible migration step is package splitting:

- `nrgy` -> `@nrgyjs/core`
- `nrgy/react` and `nrgy/mvc-react` -> `@nrgyjs/react`
- `nrgy/ditox` -> `@nrgyjs/ditox`
- `nrgy/ditox-react` -> `@nrgyjs/ditox-react`
- `nrgy/rxjs` -> `@nrgyjs/rxjs`
- `nrgy/rx-effects` -> `@nrgyjs/rx-effects`

The old package also exposed entry points that do not have a direct modern
equivalent as first-class recommendations:

- `nrgy/store`
- `nrgy/rxjs-react`
- older signal-oriented helpers from the monolith

## Import Mapping

| Old import | New import |
| --- | --- |
| `nrgy` | `@nrgyjs/core` |
| `nrgy/mvc` | `@nrgyjs/core` |
| `nrgy/react` | `@nrgyjs/react` |
| `nrgy/mvc-react` | `@nrgyjs/react` |
| `nrgy/ditox` | `@nrgyjs/ditox` |
| `nrgy/ditox-react` | `@nrgyjs/ditox-react` |
| `nrgy/rxjs` | `@nrgyjs/rxjs` |
| `nrgy/rx-effects` | `@nrgyjs/rx-effects` |
| `nrgy/store` | no direct package replacement; rewrite to `@nrgyjs/core` primitives |
| `nrgy/rxjs-react` | no direct package replacement; use `@nrgyjs/react` and `@nrgyjs/rxjs` deliberately |

## Which Concepts Are Legacy

The following concepts should be treated as legacy when migrating older code:

- store-first state organization through `nrgy/store`
- `declareStore`, `createStore`, `createStoreUpdates`, `declareStateUpdates`
- old effect-state patterns that are no longer recommended
- older MVC-specific shapes that do not match the current preferred
  controller or view-model architecture
- `rxjs-react` as a dedicated integration path from the monolithic package
- `rx-effects` as a less relevant integration for most teams

There are also API-level clues in `nrgy@0.0.46` itself:

- `nrgy/store` already contained deprecated helpers such as
  `pipeStateMutations`
- the old monolith exposed `signal`, `signalChanges`, `mixSignals`, and other
  signal-first utilities that are not the center of the current product docs

## What Not To Write in New Code

Avoid these patterns in new code:

- new store-based state layers using `declareStore` and related APIs
- new effect-state style abstractions if the same workflow can be expressed with
  atoms, effects, scopes, controllers, or view models
- new code that mixes UI lifecycle and business lifecycle implicitly
- new code built around the old monolithic package structure
- new investment into `rx-effects` unless you are maintaining an existing
  integration

Prefer these patterns instead:

- `atom`, `compute`, `effect`, `scope`, and `batch` from `@nrgyjs/core`
- `declareController()` for business logic boundaries
- `declareViewModel()` for UI-facing contracts
- `@nrgyjs/react` for React bindings
- `@nrgyjs/ditox` and `@nrgyjs/ditox-react` for DI

## Concept Mapping

| Old concept | Recommended modern pattern |
| --- | --- |
| monolithic `nrgy` package | scoped `@nrgyjs/*` packages by responsibility |
| `nrgy/store` | atoms, computed atoms, effects, scopes, controllers, and view models |
| `declareStore` and store update helpers | `atom()`, `compute()`, `batch()`, and controller or view-model actions |
| custom state update collections | `atom.withUpdates()` for named atom-level updates |
| effect-state style abstractions | plain atoms plus explicit actions and effects |
| UI-owned business logic | controller or view-model owned feature logic |
| implicit resource ownership | explicit scopes and `destroy()` |
| `rxjs-react` specific hooks | `@nrgyjs/react` for UI binding and `@nrgyjs/rxjs` only where stream bridging is really needed |
| heavy investment into `rx-effects` | treat as legacy-oriented unless maintaining existing code |

## How To Rewrite Old Code

### Old controller imports

If old code imports from the monolith:

```ts
import { declareController } from 'nrgy/mvc';
import { useController } from 'nrgy/mvc-react';
```

move to:

```ts
import { declareController } from '@nrgyjs/core';
import { useController } from '@nrgyjs/react';
```

### Old store-based state

If old code uses store-based APIs from `nrgy/store`, prefer rewriting the state
as:

- atoms for mutable state
- computed atoms for derivations
- effects for reactions
- a controller or view model as the feature boundary
- `atom.withUpdates()` when you want explicit named updates on top of atom state

This is not a one-to-one mechanical rename. It is usually a structural rewrite
from store-first modeling to explicit reactive state and lifecycle ownership.

For example, store update helpers can often be rewritten into named atom
updates:

```ts
const count = atom(0).withUpdates({
  increase: (value, step: number = 1) => value + step,
  decrease: (value, step: number = 1) => value - step,
});

count.updates.increase();
count.updates.decrease(2);
```

### Old effect-state patterns

If old code uses effect-state style patterns, migrate them toward:

- plain atoms for state
- controller or view-model actions for workflow steps
- effects only where real side effects are needed

The key idea is to make writes, derivations, and cleanup explicit instead of
embedding them into custom effect-state layers.

### Old shared screen logic

If old code keeps screen logic directly in React components, move it toward:

- a controller when the logic is mainly business-oriented
- a view model when the contract is primarily UI-facing

### Old DI wiring

If old code wires services implicitly or through globals, move it toward:

- `withContainer()`
- `withInjections()`
- `applyInjections()`
- `DitoxNrgyExtension` in React applications

## Migration Checklist

1. Replace monolithic `nrgy/*` imports with the corresponding `@nrgyjs/*`
   packages.
2. Identify usages of `nrgy/store` and plan a rewrite to atoms, effects,
   controllers, or view models.
3. Move business logic out of React components into controllers or view models.
4. Replace implicit resource ownership with explicit scopes and `destroy()`.
5. Review long-lived state and add cleanup strategy where needed.
6. Separate feature params from injected services.
7. Move DI wiring to `@nrgyjs/ditox` and `@nrgyjs/ditox-react`.
8. Treat `rx-effects` integrations as legacy-oriented unless they are already in
   production and need maintenance.
