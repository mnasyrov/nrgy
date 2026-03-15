# Controllers

## Purpose

This page documents controllers as the primary business-logic unit in Nrgy.js.

## Basic Declaration

`declareController()` is the main API for defining controller logic. It lets
you describe how a controller instance is created, which state it owns, which
actions it exposes, and which resources must be destroyed with it.

```ts
import { declareController, readonlyAtom } from '@nrgyjs/core';

export const SearchController = declareController(({ scope }) => {
  const query = scope.atom('');
  const loading = scope.atom(false);

  return {
    state: {
      query: readonlyAtom(query),
      loading: readonlyAtom(loading),
    },
    setQuery: (value: string) => query.set(value),
    search: async () => {
      loading.set(true);

      try {
        // async work
      } finally {
        loading.set(false);
      }
    },
  };
});
```

Typical controller shape:

```ts
declareController(({ scope }) => {
  const localState = scope.atom(initialValue);

  return {
    state: {
      localState: readonlyAtom(localState),
    },
    actionName: () => {
      // mutate state or call services
    },
  };
});
```

## What a Controller Should Do

- own feature-local state
- coordinate effects and services
- translate external dependencies into UI-ready behavior
- expose a small stable contract

## What a Controller Should Not Do

- render UI
- depend directly on a specific component implementation
- become a dumping ground for unrelated application state

## Params and Dependencies

There are two main ways to get external data into controller logic:

- constructor params for feature-specific inputs
- extensions and DI for infrastructure dependencies

This separation matters. Feature inputs and service wiring solve different
problems and should stay distinct in documentation and code.

### Params

Use params when the controller needs external feature inputs that are known by
the caller and are not infrastructure dependencies.

Typical examples:

- an initial value
- an entity identifier
- screen-specific configuration

Keep params explicit and close to the feature boundary.

### Extensions

Use extensions when the controller needs integrations that should be wired from
the outside, such as DI containers, view bindings, or other environment
specific capabilities.

Extensions are the mechanism that lets Nrgy.js connect controller declarations
to external systems without hardcoding those systems into business logic.

## Lifecycle

Every controller should have an obvious owner and an obvious destruction point.

Controller lifecycle in practice:

- a controller instance is created from its declaration
- it allocates local state, subscriptions, child scopes, and service bindings
- it serves one feature boundary while that feature is alive
- it must release owned resources on `destroy()`

Destroy when:

- a screen is unmounted
- a feature flow ends
- a temporary process is no longer needed

This keeps subscriptions, child scopes, and external resources contained.

At destruction time, a controller should release:

- subscriptions and effects
- child scopes
- long-lived local state that should not remain reachable
- external resources registered through cleanup callbacks

## Recommended Public Shape

For most features, this shape works well:

```ts
{
  state: { ...atomsExposedAsReadonly },
  actionA() {},
  actionB() {},
}
```

Keep state and actions explicit and easy to scan.

## Class-Based Controllers

Class-based controllers should be used only when class semantics are actually
needed, for example:

- integration with code that expects class instances
- inheritance-based customization in legacy code
- framework or tooling constraints that require class-shaped APIs

The preferred default for documentation should remain declaration-first
controllers built with `declareController()`, because they express the public
contract and lifecycle more directly.
