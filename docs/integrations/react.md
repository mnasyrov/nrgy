# React

## Purpose

This page explains how to connect Nrgy.js controllers, view models, and atoms
to React components.

## Main APIs

`@nrgyjs/react` provides the main React integration layer:

- `useAtom()`
- `useAtoms()`
- `useController()`
- `withViewController()`
- `withViewModel()`
- `NrgyControllerExtension`

## Subscribing to Atoms

Use `useAtom()` when a component depends on one atom.

```tsx
import React from 'react';
import { useAtom } from '@nrgyjs/react';

function CounterValue({ controller }: { controller: CounterController }) {
  const count = useAtom(controller.state.count);

  return <span>{count}</span>;
}
```

Use `useAtoms()` when a component reads several atoms as one stable object.

```tsx
import React from 'react';
import { useAtoms } from '@nrgyjs/react';

function SearchState({ controller }: { controller: SearchController }) {
  const { query, loading } = useAtoms(controller.state);

  return <span>{loading ? `Loading ${query}` : query}</span>;
}
```

## Mounting a Controller in React

Use `useController()` when the component should create and own the controller
instance.

```tsx
import React from 'react';
import { useAtom, useController } from '@nrgyjs/react';

function CounterScreen() {
  const controller = useController(CounterController);
  const count = useAtom(controller.state.count);

  return (
    <button onClick={controller.increase}>
      Count: {count}
    </button>
  );
}
```

`useController()` is the most direct way to connect a controller or view model
to React lifecycle.

## Higher-Level Bindings

Use `withViewController()` or `withViewModel()` when you want a wrapper that
injects the controller or view model into component props.

These helpers are useful when:

- you want a declarative wrapper around component wiring
- a team prefers HOC-style composition
- view props should be connected to controller/view-model creation explicitly

### withViewController()

`withViewController()` wraps a React component and injects a controller
instance into its props.

Use it when:

- the team prefers HOC-based composition over calling `useController()`
- controller creation should be declared together with the component boundary
- a view should explicitly receive a controller-shaped contract in props

For MVVM-style UI composition, this is an important helper because it keeps the
component focused on rendering while controller creation and lifecycle stay in
the wrapper layer.

### withViewModel()

`withViewModel()` wraps a React component and injects a view model instance into
its props.

Use it when:

- the view should depend on a presentation contract rather than raw service
  wiring
- state and actions should be exposed to the component through a view-model
  boundary
- the team wants MVVM composition to be explicit at the React component level

This is one of the most important React helpers for MVVM in Nrgy.js, because it
makes the view-model contract visible in the component API while keeping
business logic outside the view.

## Avoiding Unnecessary Rerenders

- use `useAtom()` for one atom instead of subscribing to a larger state object
- use `useAtoms()` when several atoms are rendered together
- expose narrow view-facing state from controllers and view models
- avoid passing large mutable state bags through one component boundary

## Extensions in React

`NrgyControllerExtension` lets React components contribute extension providers
to nested controller creation. This is how React-side wiring, including DI, can
be passed into `useController()`.
