# `withViewController.tsx`

## Purpose

This module provides the `withViewController()` HOC, which automatically
creates a controller and passes it to a React component through the
`controller` prop.

## Overview

This module is designed for React views that need a controller but should not
call `useController()` manually in every component. The HOC keeps the API
declarative: you define the controller separately and then bind it to a visual
component.

## Conceptual Architecture

`withViewController()` accepts a `ControllerDeclaration`, returns an HOC
factory, and calls `useController(controllerDeclaration, props)` inside the
wrapper component. The wrapped `ViewComponent` receives:

- all original `props`;
- an additional `controller` prop containing the service instance.

The HOC therefore remains a thin adapter over `useController()`.

## Public API Description

### `withViewController<TProps, TService>(controllerDeclaration)`

- `controllerDeclaration`: controller declaration built for
  `ViewControllerContext<TProps>`.
- Returns a function that accepts a component of type
  `React.ComponentType<TProps & { controller: TService }>` and produces
  `FC<TProps>`.

## Usage Examples

```tsx
import React from 'react';
import { declareController, readonlyAtom, withView } from '@nrgyjs/core';
import { useAtom, withViewController } from '@nrgyjs/react';

const CounterController = declareController()
  .extend(withView<{ initialValue: number }>())
  .apply(({ scope, view }) => {
    const value = scope.atom(view.props.initialValue());

    return {
      value: readonlyAtom(value),
      increase: () => value.update((prev) => prev + 1),
    };
  });

const CounterView = withViewController(CounterController)(
  ({ controller }) => {
    const value = useAtom(controller.value);

    return <button onClick={controller.increase}>{value}</button>;
  },
);
```

