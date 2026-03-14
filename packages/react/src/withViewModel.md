# `withViewModel.tsx`

## Purpose

This module provides the `withViewModel()` HOC, which creates a view model and
passes it to a React component through the `viewModel` prop.

## Overview

`withViewModel()` targets MVVM scenarios where a visual component expects a
`viewModel` object and typically reads state through `useAtoms()`. The module
also exports `withViewModelImpl()`, which serves as the internal implementation
and can be reused by extensions.

## Conceptual Architecture

The module wraps `useController()` with a type-safe layer for
`ViewModelDeclaration`.

1. `withViewModel()` accepts a view-model declaration and returns an HOC
   factory.
2. `withViewModelImpl()` builds the wrapper component, separates `children`
   from the remaining props, and passes the rest into `useController()`.
3. The resulting component renders the original `ViewComponent`, forwarding
   `children`, the original props, and the created `viewModel`.

This design preserves strict typing through `InferViewModelProps` and removes
the need for repetitive manual casting in React views.

## Public API Description

### `withViewModel<TViewModel>(viewModelDeclaration)`

- `viewModelDeclaration`: view-model declaration compatible with
  `ViewControllerContext<InferViewModelProps<TViewModel>>`.
- Returns a function that accepts a component with a `viewModel` prop and
  creates an HOC with automatically inferred view-model props.

### `withViewModelImpl(viewModelDeclaration, ViewComponent)`

- Internal helper for constructing the HOC.
- Accepts a view-model declaration and a React component.
- Returns a component that creates the `viewModel` through `useController()`.

## Usage Examples

```tsx
import React from 'react';
import { declareViewModel, readonlyAtom } from '@nrgyjs/core';
import { useAtoms, withViewModel } from '@nrgyjs/react';

const CounterViewModel = declareViewModel(({ scope, view }) => {
  const value = scope.atom(view.props.initialValue());

  return {
    state: { value: readonlyAtom(value) },
    increase: () => value.update((prev) => prev + 1),
  };
});

const Counter = withViewModel(CounterViewModel)(({ viewModel }) => {
  const { value } = useAtoms(viewModel.state);

  return <button onClick={viewModel.increase}>{value}</button>;
});
```

