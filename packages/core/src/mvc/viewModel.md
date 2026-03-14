# `viewModel.ts`

## Purpose

This module implements the declarative view-model API in `@nrgyjs/core`,
combining the controller mechanism with view props and reactive UI state.

## Overview

`declareViewModel()` is built on top of the controller API and `withView()`.
The result is a view model that usually contains:

- `props`: atom-backed representation of incoming props;
- `state`: atom-backed UI state;
- business methods and actions.

The module supports both functional and class-based view models.

## Conceptual Architecture

The internal organization is:

1. `BaseViewModel` and `ViewModel<T>` define the shape of a view model.
2. `InferViewModelProps<T>` extracts input prop types from the `props` atom map.
3. `BaseViewController` extends `BaseController` and exposes `view` and `props`
   as convenient class fields.
4. `ViewModelDeclarationBuilder` automatically adds `withView()` and creates a
   declaration through `apply()` or a base class through `getBaseClass()`.
5. `declareViewModel()` is the overloaded entry point: it either accepts a
   factory directly or returns a builder.

This lets view models reuse the full controller lifecycle while remaining
strictly typed against their view props.

## Public API Description

### Core Types

- `BaseViewModel`: base shape with optional `props` and `state`.
- `ViewModel<T>`: alias for the final view-model type.
- `InferViewModelProps<TViewModel>`: infers prop shape from `viewModel.props`.
- `ViewModelFactory<TContext, TViewModel>`: functional view-model factory.
- `ViewModelDeclaration<TViewModel, TContext>`: declaration type for a
  view-model.
- `ViewModelClassDeclaration<TViewModel, TContext>`: class-based declaration
  type.

### Classes and Functions

- `BaseViewController<TViewModel, TContext>`: base class for class-based
  view-models.
- `ViewModelDeclarationBuilder<TContext>`: builder for view-model declarations.
- `declareViewModel(factory?)`: creates a declaration or a builder.

## Usage Examples

```ts
import { declareViewModel, readonlyAtom } from '@nrgyjs/core';

const CounterViewModel = declareViewModel(({ scope, view }) => {
  const value = scope.atom(view.props.initialValue());

  return {
    state: { value: readonlyAtom(value) },
    increase: () => value.update((prev) => prev + 1),
  };
});
```

