# `useController.ts`

## Purpose

This module contains the `useController()` hook, which creates and manages a
controller or view model instance inside a React component.

## Overview

`useController()` is the main integration point between React and
`@nrgyjs/core`. It accepts a controller or view-model declaration, optionally
passes view props into it, and synchronizes the created instance with the React
component lifecycle.

## Conceptual Architecture

The hook works as follows:

1. It reads React-specific `ExtensionParamsProvider` functions from
   `NrgyControllerExtension`.
2. It creates a `ViewProxy` for the current props by calling
   `createViewProxy()`.
3. It appends `provideView(view)` to the provider list and creates the
   controller instance with `new declaration(providers)`.
4. It stores the controller instance and its `ViewProxy` in `useRef()` to avoid
   recreating them on every render.
5. In a separate `useEffect()`, it forwards updated props into
   `view.update(props)`.
6. In the lifecycle effect, it calls `view.mount()` on mount and then
   `view.destroy()` together with `controller.destroy()` on unmount or when the
   declaration changes.

The hook also re-invokes extension providers on later renders so React hooks
inside extensions keep their execution order intact.

## Public API Description

### `useController<TContext, TService>(declaration): TService`

- `declaration`: controller or view-model declaration with no required
  view props.
- Returns the created service instance of type `TService`.

### `useController<TContext, TService, TProps>(declaration, props): TService`

- `declaration`: controller or view-model declaration that depends on view
  props.
- `props`: props object passed into the `ViewProxy`.
- Returns the created service instance of type `TService`.

## Usage Examples

```tsx
import React from 'react';
import { declareController, withView } from '@nrgyjs/core';
import { useController } from '@nrgyjs/react';

const GreetingController = declareController()
  .extend(withView<{ name: string }>())
  .apply(({ view }) => ({
    title: () => `Hello, ${view.props.name()}!`,
  }));

export function Greeting(props: { name: string }) {
  const controller = useController(GreetingController, props);

  return <h1>{controller.title()}</h1>;
}
```
